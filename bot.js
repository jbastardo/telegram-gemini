import { Telegraf } from 'telegraf';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(userMessage);
    const textResponse = result.response.text();
    
    // Enviar la respuesta de vuelta al usuario
    await ctx.reply(textResponse);
  } catch (error) {
    console.error("Error al comunicarse con Gemini:", error);
    ctx.reply("Hubo un error procesando tu solicitud. Por favor intenta de nuevo más tarde.");
  }
});

// Iniciar el bot
bot.launch();

console.log("Bot de Telegram iniciado exitosamente.");

// Habilitar el apagado elegante
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
