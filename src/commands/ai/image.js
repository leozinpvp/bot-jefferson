import { GoogleGenerativeAI } from "@google/generative-ai";
import whatsappPkg from "whatsapp-web.js";

const { MessageMedia } = whatsappPkg;

const apiKey = process.env.API_GEMINI;
if (!apiKey) {
    console.error("Erro: A variável de ambiente API_GEMINI não foi definida.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const imageModel = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-preview-image-generation",
});

/**
 * Gera e envia uma lista de comandos formatada e estilizada.
 * 
 * @param {import("whatsapp-web.js").Message} ctx - Contexto da mensagem recebida.
 * @param {boolean} [stick=false] 
 */
export async function useAiImage(stick = false, ctx) {
    const cleanMsg = stick ? ctx.body.replace(/^!fig\s+/i, '') :
        ctx.body.replace(/^!imagem?\s+/i, '');


    const input = cleanMsg.trim();
    if (!input) {
        await ctx.reply("⚠️ Escreva algo após o comando, ex: `!image um gato astronauta`");
        return;
    }

    try {
        const result = await imageModel.generateContent({
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: `If no other proportion is requested, use square resizing, ideal for stickers.: ${input}` }
                    ]
                }
            ],
            generationConfig: {
                responseModalities: ['IMAGE', 'TEXT'],
            },
        });

        const response = result.response;

        let imageBuffer = null;
        let mimeType = 'image/png';

        if (response.candidates && response.candidates[0]) {
            const candidate = response.candidates[0];

            if (candidate.content && candidate.content.parts) {
                for (const part of candidate.content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        const base64String = part.inlineData.data;
                        mimeType = part.inlineData.mimeType || 'image/png';
                        imageBuffer = Buffer.from(base64String, 'base64');
                        break;
                    }
                }
            }
        }

        if (imageBuffer) {
            const media = new MessageMedia(
                mimeType,
                imageBuffer.toString('base64'),
                'imagem.png'
            );

            if (!stick) await ctx.reply(media, null, { caption: '🎨 Aqui está sua imagem!' });

            else await ctx.reply(media, null, { sendMediaAsSticker: true });
        } else {
            console.error("Resposta completa:", JSON.stringify(response, null, 2));
            await ctx.reply("🤖 Desculpe, não consegui encontrar a imagem na resposta da API.");
        }

    } catch (error) {
        console.error("Erro ao contatar a API de Imagem ou processar a resposta:", error);
        await ctx.reply("🤖 Desculpe, não consegui processar sua solicitação no momento. Verifique os logs para mais detalhes.");
    }
}