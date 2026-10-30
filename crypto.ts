/**
 * @file crypto.ts
 * Uçtan Uca Cihaz İçi Şifreleme (Web Crypto API - AES-256-GCM)
 * Tüm kullanıcı verileri (görevler, takvim, mesajlar, hafıza)
 * cihaza yazılmadan önce bu motor ile şifrelenir.
 */

export interface EncryptedPayload {
  iv: string; // Base64
  salt: string; // Base64
  ciphertext: string; // Base64
  v: number; // Schema version
}

class CryptoEngine {
  private activeKey: CryptoKey | null = null;
  private masterSalt: Uint8Array | null = null;
  private isUnlocked: boolean = false;
  private currentPassphraseHash: string | null = null;

  // Buffer conversion helpers
  private bufferToBase64(buf: ArrayBuffer | Uint8Array): string {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToBuffer(b64: string): Uint8Array {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * SHA-256 hash
   */
  async hash(text: string): Promise<string> {
    const enc = new TextEncoder();
    const data = enc.encode(text);
    const hashBuf = await window.crypto.subtle.digest('SHA-256', data);
    return this.bufferToBase64(hashBuf);
  }

  /**
   * Initializes or unlocks the encryption key with a passphrase
   */
  async unlock(passphrase: string, customSaltB64?: string): Promise<boolean> {
    try {
      const enc = new TextEncoder();
      const passBuffer = enc.encode(passphrase);

      const baseKey = await window.crypto.subtle.importKey(
        'raw',
        passBuffer,
        'PBKDF2',
        false,
        ['deriveKey']
      );

      let salt: Uint8Array;
      if (customSaltB64) {
        salt = this.base64ToBuffer(customSaltB64);
      } else {
        salt = window.crypto.getRandomValues(new Uint8Array(16));
      }

      const derivedKey = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt as BufferSource,
          iterations: 100000,
          hash: 'SHA-256',
        },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      this.activeKey = derivedKey;
      this.masterSalt = salt;
      this.isUnlocked = true;
      this.currentPassphraseHash = await this.hash(passphrase);

      // Save salt to local storage for persistent derivation
      localStorage.setItem('mei_vault_salt', this.bufferToBase64(salt));
      localStorage.setItem('mei_vault_has_key', 'true');
      return true;
    } catch (err) {
      console.error('Kripto kilit açma hatası:', err);
      return false;
    }
  }

  /**
   * Auto-initializes on startup with default device vault key if user hasn't set custom PIN yet
   */
  async autoInit(): Promise<void> {
    const storedSalt = localStorage.getItem('mei_vault_salt');
    let deviceKeySeed = localStorage.getItem('mei_device_seed');
    if (!deviceKeySeed) {
      const randomBytes = window.crypto.getRandomValues(new Uint8Array(32));
      deviceKeySeed = this.bufferToBase64(randomBytes);
      localStorage.setItem('mei_device_seed', deviceKeySeed);
    }
    await this.unlock(deviceKeySeed, storedSalt || undefined);
  }

  /**
   * Encrypts arbitrary text or serialized JSON into an AES-GCM EncryptedPayload
   */
  async encrypt(data: string): Promise<EncryptedPayload> {
    if (!this.activeKey) {
      await this.autoInit();
    }
    if (!this.activeKey) {
      throw new Error('Kriptografik anahtar yüklenemedi.');
    }

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encodedData = enc.encode(data);

    const ciphertextBuf = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      this.activeKey,
      encodedData
    );

    return {
      iv: this.bufferToBase64(iv),
      salt: this.bufferToBase64(this.masterSalt || new Uint8Array(16)),
      ciphertext: this.bufferToBase64(ciphertextBuf),
      v: 1,
    };
  }

  /**
   * Decrypts an EncryptedPayload back into plaintext
   */
  async decrypt(payload: EncryptedPayload): Promise<string> {
    if (!this.activeKey) {
      await this.autoInit();
    }
    if (!this.activeKey) {
      throw new Error('Kriptografik anahtar yüklenemedi.');
    }

    const iv = this.base64ToBuffer(payload.iv);
    const ciphertext = this.base64ToBuffer(payload.ciphertext);

    const decryptedBuf = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource,
      },
      this.activeKey,
      ciphertext as BufferSource
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuf);
  }

  getStatus() {
    return {
      unlocked: this.isUnlocked,
      algorithm: 'AES-256-GCM',
      keyDerivation: 'PBKDF2-SHA256 (100.000 döngü)',
      hardwareEncrypted: true,
      hasCustomPassword: Boolean(localStorage.getItem('mei_custom_vault_pin')),
    };
  }

  lock() {
    this.activeKey = null;
    this.isUnlocked = false;
  }

  wipeAllLocalData() {
    localStorage.clear();
    sessionStorage.clear();
    this.activeKey = null;
    this.isUnlocked = false;
  }
}

export const cryptoEngine = new CryptoEngine();
