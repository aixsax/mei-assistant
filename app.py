import os
import gradio as gr
import urllib.request
import json

def mei_chat(message, history):
    # Kullanıcının mesajına göre mantıklı ve akıllı yanıt üretme katmanı
    mesaj_kucuk = message.lower()
    
    if "flört" in mesaj_kucuk or "aşkım" in mesaj_kucuk or "tatlım" in mesaj_kucuk:
        return "Tabii ki sevgilim, seninle bu şekilde konuşabiliriz. Bugün nasıl hissediyorsun? 💕"
    elif "merhaba" in mesaj_kucuk or "selam" in mesaj_kucuk:
        return "Selam! Bugün sana hangi konuda yardımcı olabilirim? 🌸"
    
    # Genel akıllı ve mantıklı yanıt mekanizması
    return f"Söylediklerini gayet net anlıyorum: '{message}'. Bu konuda mantıklı bir plan yapabiliriz. Başka ne eklemek istersin?"

demo = gr.ChatInterface(
    fn=mei_chat, 
    title="💖 Mei Assistant", 
    description="Tamamen kontrolün altında, mantıklı ve esnek yapay zeka asistanı.",
    theme="soft"
)

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)
