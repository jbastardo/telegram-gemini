import { Telegraf } from 'telegraf';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

// Inicializar el cliente de Gemini
const genAI = new GoogleGenerativeAI(geminiApiKey);

// Variable para guardar el modelo correcto
let activeModelName = "gemini-1.5-flash";

async function setBestModel() {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`);
    const data = await res.json();
    if (data && data.models) {
      const generateModels = data.models.filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"));
      const flashModel = generateModels.find(m => m.name.includes("flash"));
      const bestModel = flashModel || generateModels[0];
      if (bestModel) {
        activeModelName = bestModel.name.replace('models/', '');
        console.log("Modelo seleccionado automáticamente:", activeModelName);
      }
    }
  } catch (err) {
    console.error("No se pudo obtener la lista de modelos, usando por defecto:", activeModelName);
  }
}

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
    const model = genAI.getGenerativeModel({ model: activeModelName });
    const result = await model.generateContent(userMessage);
    const textResponse = result.response.text();
    
    // Enviar la respuesta de vuelta al usuario
    await ctx.reply(textResponse);
  } catch (error) {
    console.error("Error al comunicarse con Gemini:", error);
    ctx.reply("Hubo un error procesando tu solicitud. Por favor intenta de nuevo más tarde.");
  }
});

// Iniciar el bot y la configuración
setBestModel().then(() => {
  bot.launch();
  console.log("Bot de Telegram iniciado exitosamente.");
});

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
