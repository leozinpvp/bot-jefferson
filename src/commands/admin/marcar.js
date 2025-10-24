module.exports = async (client, msg) => {
    if (msg.body.toLowerCase() !== '!marcar') return;

    const chat = await msg.getChat();
    if (!chat.isGroup) return msg.reply('Isso só funciona em grupo.');

    const mentions = [];
    let texto = '📣 Chamando geral:\n\n';

    for (let participant of chat.participants) {
        mentions.push(participant.id._serialized);
        texto += `@${participant.id.user} `;
    }

    await chat.sendMessage(texto, { mentions });
};
