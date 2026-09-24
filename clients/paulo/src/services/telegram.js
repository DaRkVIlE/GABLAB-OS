/**
 * Sócio Digital — Telegram Bot (Letícia Estética)
 * Gabriel recebe Morning Brief e pode interagir com o bot como parceiro estratégico.
 * Suporta texto e áudio (Whisper transcrição).
 */
const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');
const fs = require('fs');
const os = require('os');
const { generatePartnerPrompt, generateGreeting } = require('../prompts/partner');
const { loadEnv } = require('../config/env');
const memory = require('../utils/memory');

const config = loadEnv();

if (!config.telegramToken) {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN não definido. Sócio Digital (Telegram) DESATIVADO.');
    module.exports = null;
    return;
}

const groq = new Groq({ apiKey: config.groqApiKey });
const bot = new TelegramBot(config.telegramToken, { polling: true });
const partnerPrompt = generatePartnerPrompt();
const greeting = generateGreeting();

async function processMessage(chatId, text) {
    memory.getOrCreate(chatId, partnerPrompt);
    memory.addMessage(chatId, 'user', text);

    try {
        const completion = await groq.chat.completions.create({
            messages: memory.getMessages(chatId),
            model: config.llm.model,
            temperature: config.llm.partner.temperature,
            max_tokens: config.llm.partner.maxTokens,
        });
        const resposta = completion.choices[0].message.content;
        memory.addMessage(chatId, 'assistant', resposta);
        bot.sendMessage(chatId, resposta);
    } catch (error) {
        console.error('[Groq Partner] Erro:', error.message);
        bot.sendMessage(chatId, 'Chefe, tive um problema aqui. Pode repetir?');
    }
}

bot.on('message', async (msg) => {
    if (msg.voice || msg.audio) return;
    const chatId = msg.chat.id;
    const text = msg.text || '';

    if (text === '/start') {
        memory.reset(chatId, partnerPrompt);
        return bot.sendMessage(chatId, greeting);
    }
    if (!text) return;

    console.log(`[Telegram IN] ${msg.chat.first_name || 'Gabriel'}: ${text}`);
    await processMessage(chatId, text);
});

bot.on('voice', async (msg) => {
    const chatId = msg.chat.id;
    const loadingMsg = await bot.sendMessage(chatId, '🎙️ _Ouvindo..._', { parse_mode: 'Markdown' });

    try {
        const filePath = await bot.downloadFile(msg.voice.file_id, os.tmpdir());
        const newFilePath = filePath + '.ogg';
        fs.renameSync(filePath, newFilePath);

        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(newFilePath),
            model: 'whisper-large-v3-turbo',
            language: 'pt',
            response_format: 'json',
        });

        if (fs.existsSync(newFilePath)) fs.unlinkSync(newFilePath);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        const texto = transcription.text;
        bot.deleteMessage(chatId, loadingMsg.message_id).catch(() => {});
        bot.sendMessage(chatId, `_"${texto}"_`, { parse_mode: 'Markdown' });
        await processMessage(chatId, texto);
    } catch (err) {
        console.error('[Whisper] Erro:', err.message);
        bot.deleteMessage(chatId, loadingMsg.message_id).catch(() => {});
        bot.sendMessage(chatId, 'Não consegui ouvir. Tenta escrever!');
    }
});

bot.on('polling_error', (error) => {
    if (error.code === 'ETELEGRAM' && error.message.includes('409')) {
        console.warn('[Telegram] Conflito 409 (redeploy). Ignorando...');
    } else {
        console.error('[Telegram] Erro:', error.message);
    }
});

process.on('SIGTERM', () => { bot.stopPolling(); });

console.log('🤖 Sócio Digital (Telegram) inicializado!');
module.exports = bot;
