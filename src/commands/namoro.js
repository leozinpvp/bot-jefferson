const namoros = {};

module.exports = async (client, msg) => {
    const chat = await msg.getChat();
    const sender = msg.author || msg.from;

    // Pedido de namoro
    if (msg.body.startsWith('!namoracomigo')) {
        const mentioned = msg.mentionedIds[0];
        if (!mentioned) return msg.reply('Marca a pessoa: !namoracomigo @alguem');

        if (namoros[sender]) return msg.reply('Você já está em um relacionamento 😏');
        if (namoros[mentioned]) return msg.reply('Essa pessoa já está comprometida 💔');

        await chat.sendMessage(
            `❤️ @${mentioned.split('@')[0]}, ${msg._data.notifyName} está te pedindo em namoro!\nResponde com *!aceito* ou *!recuso*`,
            { mentions: [mentioned] }
        );
        namoros[mentioned] = { pedido: sender };
    }

    // Aceitar
    if (msg.body.toLowerCase() === '!aceito') {
        const pedido = namoros[sender];
        if (!pedido) return;
        namoros[sender] = pedido.pedido;
        namoros[pedido.pedido] = sender;
        await chat.sendMessage(
            `💍 Agora é oficial! @${sender.split('@')[0]} e @${pedido.pedido.split('@')[0]} estão namorando! ❤️`,
            { mentions: [sender, pedido.pedido] }
        );
    }

    // Recusar
    if (msg.body.toLowerCase() === '!recuso') {
        const pedido = namoros[sender];
        if (!pedido) return;
        delete namoros[sender];
        await chat.sendMessage(
            `😢 Pedido recusado... força aí @${pedido.pedido.split('@')[0]} 😔`,
            { mentions: [pedido.pedido] }
        );
    }
};
