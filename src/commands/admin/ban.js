module.exports = async (client, msg) => {
    if (!msg.body.startsWith('!ban')) return;

    const chat = await msg.getChat();
    if (!chat.isGroup) return msg.reply('Comando só funciona em grupo.');

    const mentioned = msg.mentionedIds[0];
    if (!mentioned) return msg.reply('Marca alguém pra banir: !ban @pessoa');

    const sender = msg.author || msg.from;
    const participant = chat.participants.find(p => p.id._serialized === sender);

    if (!participant?.isAdmin) return msg.reply('Apenas admins podem usar esse comando 🛑');

    try {
        await chat.removeParticipants([mentioned]);
        await chat.sendMessage(
            `🚫 Usuário @${mentioned.split('@')[0]} foi banido do grupo!`,
            { mentions: [mentioned] }
        );
    } catch (err) {
        console.error(err);
        msg.reply('Não consegui banir 😔 — confere se sou admin.');
    }
};
