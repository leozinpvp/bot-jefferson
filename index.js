import qrcode from 'qrcode-terminal';
import path from 'path';
import whatsappPkg from "whatsapp-web.js";
import { store } from './src/database/mongodb.js';
import { execCommand, isCommand } from './src/commands/commands.js';
import { commandsChatBot } from './src/commands/private/chatbot/commands.js';
import { chatbot } from './src/commands/private/chatbot.js';
import { inChatBot } from './src/commands/private/chatbot/array.js';

const { Client, RemoteAuth } = whatsappPkg;


const client = new Client({
    puppeteer: {
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || `/usr/bin/google-chrome`,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    authStrategy: new RemoteAuth({
        clientId: 'wh-bot',
        store,
        dataPath: path.join('.cache/.wwebjs_auth'),
        backupSyncIntervalMs: 300000
    })
});

client.on('qr', async qr => {
    console.log('\n📱 Escaneie este QR com o WhatsApp:\n');
    qrcode.generate(qr, { small: true })
    console.log('\n--------------------------------------\n');
});

client.on('authenticated', () => console.log('✅ Autenticado com sucesso!'));
client.on('ready', () => {
    if (process.env.MASTER_NUMBER) {
        client.sendMessage(`${process.env.MASTER_NUMBER}@c.us`, "Olá! Fui iniciado com sucesso")
    }
    console.log('🤖 Cliente pronto para uso!')
});

client.on('message', async ctx => {
    if (typeof ctx.body !== 'string' || ctx.body.length === 0) {
        return;
    }

    let clearMsg = ctx.body.trim().toLowerCase();

    if (inChatBot.has(ctx.from) && !(await ctx.getChat()).isGroup) {
        if (isCommand(clearMsg)) {
            execCommand(ctx, client, commandsChatBot);
            return
        }

        chatbot(ctx, client);

        return;
    }


    if (isCommand(clearMsg)) {
        execCommand(ctx, client);
    }
});


client.on('disconnected', reason => {
    console.log('⚠️ Desconectado:', reason);
    client.initialize();
});

client.initialize();