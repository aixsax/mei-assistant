import os
import gradio as gr
from groq import Groq

# Groq istemcisini başlatıyoruz
client = Groq(api_key="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")

def mei_chat(message, history):
    messages = [
        {
            "role": "system",
            "content": "Sen Mei adında akıllı, samimi ve dengeli bir yapay zeka asistanısın. Mantıklı, akıcı ve doğal yanıtlar verirsin."
        }
    ]
    
    # Geçmiş mesajları güvenli bir şekilde ekliyoruz
    if history:
        for entry in history:
            if isinstance(entry, (list, tuple)) and len(entry) == 2:
                user_msg, bot_msg = entry
                if user_msg:
                    messages.append({"role": "user", "content": str(user_msg)})
                if bot_msg:
                    messages.append({"role": "assistant", "content": str(bot_msg)})
                    
    messages.append({"role": "user", "content": str(message)})

    try:
        chat_completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        return f"Bağlantıda bir hata oluştu: {str(e)}"

demo = gr.ChatInterface(fn=mei_chat, title="💖 Mei Assistant")

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)
