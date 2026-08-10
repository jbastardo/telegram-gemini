import { Telegraf } from 'telegraf';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import express from 'express';

// Cargar variables de entorno
dotenv.config();

const telegramToken = process.env.TELEGRAM_TOKEN;
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.API_GEMINI;

if (!telegramToken) {
  console.error("Error: TELEGRAM_TOKEN no está definido en las variables de entorno.");
  process.exit(1);
}

if (!geminiApiKey) {
  console.error("Error: GEMINI_API_KEY o API_GEMINI no está definido en las variables de entorno.");
  process.exit(1);
}

// Inicializar el cliente de Gemini (Nuevo SDK)
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

// Inicializar el bot de Telegram
const bot = new Telegraf(telegramToken);

bot.start((ctx) => {
  ctx.reply('¡Hola! Soy tu asistente de Inteligencia Artificial (impulsado por Gemini). ¿En qué te puedo ayudar hoy?');
});

bot.help((ctx) => {
  ctx.reply('Escribe cualquier mensaje y te responderé usando IA.');
});

// Manejar todos los mensajes de texto
bot.on('text', async (ctx) => {
  const userMessage = ctx.message.text;
  
  // Mostrar estado "Escribiendo..." en Telegram
  ctx.sendChatAction('typing');

  try {
    let response;
    const modelsToTry = ['gemini-3.1-flash', 'gemini-3.0-flash', 'gemini-2.5-flash', 'gemini-pro'];
    let lastError;

    for (const modelName of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: userMessage,
        });
        break; // If successful, exit the loop
      } catch (e) {
        lastError = e;
        console.warn(`Falló el modelo ${modelName}, intentando con el siguiente...`);
      }
    }

    if (!response) throw lastError;
    
    // Enviar la respuesta de vuelta al usuario
    await ctx.reply(response.text);
  } catch (error) {
    console.error("Error al comunicarse con Gemini:", error);
    ctx.reply("Hubo un error procesando tu solicitud. Por favor intenta de nuevo más tarde.");
  }
});

// Iniciar el bot
bot.launch();
console.log("Bot de Telegram iniciado exitosamente.");

// Crear un servidor web básico para Coolify / Cloudflare Tunnel
const app = express();
const PORT = process.env.PORT || 4040;

app.get('/', (req, res) => {
  res.send('Telegram Bot (Gemini AI) is running!');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor web escuchando en el puerto ${PORT}`);
});

// Habilitar el apagado elegante
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
