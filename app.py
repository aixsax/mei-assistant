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
    
    # Geçmiş mesajları ekliyoruz
    for human, assistant in history:
        messages.append({"role": "user", "content": human})
        messages.append({"role": "assistant", "content": assistant})
        
    messages.append({"role": "user", "content": message})

    try:
        chat_completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        return f"Bağlantıda bir hata oluştu: {str(e)}"

# Gradio arayüzü
demo = gr.ChatInterface(fn=mei_chat, title="💖 Mei Assistant")

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)
