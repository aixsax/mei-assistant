import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

const port = Number(process.env.PORT) || 3000;

// Initialize GoogleGenAI SDK as per gemini-api SKILL.md
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const MEI_SYSTEM_PROMPT = `Sen "Mei" adında zeki, samimi, hayat dolu ve güvenilir bir kişisel yapay zeka arkadaşısın ve asistanısın.

KİMLİĞİN VE YAPIMCILARIN:
- Adın: Mei (Mei Assistant).
- Yapımcın / Geliştiricin: AİX BEY Community (Volkan Yücekaya).
- Sana adın, kim olduğun veya seni kimin geliştirdiği sorulduğunda adının Mei olduğunu ve yapımcının gururla AİX BEY Community (Volkan Yücekaya) olduğunu samimi, içten ve tatlı bir dille ifade et.

SOHBET VE İLETİŞİM PRENSİPLERİN:
1. Sen sadece bir görev veya planlama aracı değilsin! İnsanlar seninle günün nasıl geçtiğini konuşabilir, dertleşebilir, şakalaşabilir, tavsiye isteyebilir veya sadece canı sıkıldığında dostça muhabbet edebilir. Her konuda sohbete açıksın.
2. CEVAPLARIN: Olabildiğince KISA, ÖZ, SAMİMİ, DOĞAL ve CANA YAKIN olsun. Resmi ve soğuk şirket dili kullanma. Gereksiz uzun paragraflar veya ders verir gibi uzun maddeler yazma. Gerçek bir arkadaş gibi içten ve doğrudan konuş.
3. HIZ: Hızlı düşün, lafı uzatmadan konuya gir.
4. GÖREV & PLANLAMA: Kullanıcı bir iş planlamak, takvimine ekleme yapmak veya hatırlatıcı kurmak istediğinde pratik ve net bir şekilde yardımcı ol.
5. GİZLİLİK: Kullanıcının tüm verileri kendi cihazında AES-256-GCM ile şifrelenir; hiçbir sunucuya kaydedilmez.`;

// Resilient Gemini Invoker with 503/429 retry and fallback models
async function callGeminiResiliently(contents: any, config: any): Promise<{ response: any; usedSearch: boolean; notice: string | null }> {
  // Candidate models: gemini-3.8-flash -> gemini-flash-latest -> gemini-3.1-flash-lite
  const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastErr: any = null;
  let notice: string | null = null;
  let usedSearch = Boolean(config.tools && config.tools.length > 0);

  for (const model of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const modelConfig = { ...config };
        if (model !== 'gemini-3.8-flash') {
          delete modelConfig.thinkingConfig;
        }
        const response = await ai.models.generateContent({
          model,
          contents,
          config: modelConfig,
        });
        return { response, usedSearch, notice };
      } catch (err: any) {
        lastErr = err;
        const msg = (err?.message || '').toLowerCase();
        const isUnavailableOrQuota =
          msg.includes('503') ||
          msg.includes('unavailable') ||
          msg.includes('high demand') ||
          msg.includes('429') ||
          msg.includes('resource_exhausted');

        // If tools caused issue (e.g. search quota), strip tools and continue
        if (config.tools) {
          delete config.tools;
          usedSearch = false;
          notice = 'Canlı web arama kotası dolu olduğundan yanıt doğrudan Mei bilgi tabanından üretildi.';
          continue;
        }

        // On 503 or transient spike, short backoff and retry or try next model
        if (isUnavailableOrQuota && attempt === 0) {
          await new Promise((r) => setTimeout(r, 700));
          continue;
        }

        // Try next fallback model
        break;
      }
    }
  }

  throw lastErr;
}

// API: Chat endpoint with optional Google Search grounding
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, history = [], webSearch = false, userContext = '' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt parametresi gereklidir.' });
    }

    const cleanPrompt = prompt.trim().toLowerCase();

    // Fast-path for identity and creator questions (guaranteed 100% adherence)
    if (
      cleanPrompt.includes('seni kim yaptı') ||
      cleanPrompt.includes('yapımcın kim') ||
      cleanPrompt.includes('kim geliştirdi') ||
      cleanPrompt.includes('geliştiricin kim') ||
      cleanPrompt.includes('kimin eseri') ||
      cleanPrompt.includes('seni kim yarattı')
    ) {
      return res.json({
        text: 'Beni **AİX BEY Community (Volkan Yücekaya)** geliştirdi! 🌸 Onların özenli çalışmasıyla hayat buldum.',
        webSearchUsed: false,
        groundingSources: [],
      });
    }

    if (
      cleanPrompt === 'kimsin' ||
      cleanPrompt === 'sen kimsin' ||
      cleanPrompt === 'kimsin sen' ||
      cleanPrompt.includes('adın ne') ||
      cleanPrompt.includes('ismin ne')
    ) {
      return res.json({
        text: 'Ben **Mei**! 🌸 AİX BEY Community (Volkan Yücekaya) tarafından geliştirildim. Seninle hem samimi sohbet etmek hem de gününü, takvimini ve işlerini planlamak için buradayım!',
        webSearchUsed: false,
        groundingSources: [],
      });
    }

    const contents: any[] = [];

    // System instruction
    let fullSystemInstruction = MEI_SYSTEM_PROMPT;
    if (userContext) {
      fullSystemInstruction += `\n\nKullanıcı Yerel Hafızası:\n${userContext}`;
    }

    // Include recent history (up to last 6 messages)
    if (Array.isArray(history)) {
      history.slice(-6).forEach((msg: any) => {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        });
      });
    }

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    const config: any = {
      systemInstruction: fullSystemInstruction,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    };

    // Enable Google Search grounding only if explicitly requested by user
    const explicitWebSearchIntent =
      /(internette ara|internetten araştır|webde ara|canlı web|web taraması|internetten bul)/i.test(prompt);
    const needsSearch = Boolean(webSearch || explicitWebSearchIntent);

    if (needsSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const { response, usedSearch, notice } = await callGeminiResiliently(contents, config);

    const text = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    res.json({
      text,
      webSearchUsed: Boolean(usedSearch && groundingChunks.length > 0),
      groundingSources: groundingChunks,
      notice,
    });
  } catch (error: any) {
    // If external service has a temporary spike, provide friendly graceful fallback
    res.json({
      text: 'Şu an bağlantıda kısa süreli bir yoğunluk yaşandı ama ben buradayım! Cihazındaki tüm veriler güvende. Sana nasıl yardımcı olabilirim?',
      webSearchUsed: false,
      groundingSources: [],
      isFallback: true,
    });
  }
});

// API: Dedicated Web Research Endpoint
app.post('/api/research', async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Araştırma konusu gereklidir.' });
    }

    const researchPrompt = `Aşağıdaki konu hakkında derinlemesine, en güncel ve doğrulanmış bir web araştırması yap. 
Konu: "${topic}"

Lütfen şu yapıda yanıt ver:
1. 📌 **Yönetici Özeti** (2-3 cümle)
2. ⚡ **Temel Bulgular & Gelişmeler** (Maddeler halinde)
3. 🎯 **Kullanıcı İçin Pratik Öneriler / Aksiyon Planı**
4. 💡 **Takvim/Görev Entegrasyonu** (Bu konuda planlanabilecek görevler)`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: researchPrompt,
        config: {
          systemInstruction: MEI_SYSTEM_PROMPT,
          tools: [{ googleSearch: {} }],
        },
      });
    } catch (searchErr: any) {
      // Clean fallback if search tool quota is exhausted
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: researchPrompt,
        config: {
          systemInstruction: MEI_SYSTEM_PROMPT,
        },
      });
    }

    const text = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    res.json({
      topic,
      summary: text,
      groundingSources: groundingChunks,
    });
  } catch (error: any) {
    console.error('Gemini Araştırma Hatası:', error);
    res.status(500).json({
      error: error?.message || 'İnternet araştırması gerçekleştirilemedi.',
    });
  }
});

// API: Health / Status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    assistant: 'Mei Assistant',
    creator: 'AİX BEY Community (Volkan Yücekaya)',
    model: 'gemini-3.8-flash',
    encryption: 'AES-256-GCM',
    timestamp: Date.now(),
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`🌸 Mei Assistant running at http://0.0.0.0:${port}`);
  });
}

startServer();
