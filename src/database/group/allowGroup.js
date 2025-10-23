import { commands } from "../../commands/commands.js";
import { getCol } from "../mongodb.js";

/**
 * Autoriza comandos específicos em um grupo do WhatsApp.
 * 
 * @param {string} group_id - ID do grupo do WhatsApp.
 * @param {import("whatsapp-web.js").Message} ctx - ID do grupo do WhatsApp.
 * @returns {Promise<{ message: string }>} Mensagem com o resultado da operação.
 */
export default async function allowGroup(group_id, ctx, admin = false) {
    const commandCall = admin ? "aagp" : "agp"
    const regex = new RegExp(`^!${commandCall}\\s+`, "i");
    const args = ctx.body.replace(regex, '').trim().split(' ');

    const inputCommands = args
        .map(v => v.trim().replaceAll(',', ''))
        .filter(v => v.length > 0);

    const commandsValid = inputCommands.filter(v =>
        commands.some(({ name }) => name.toLowerCase() === v.toLowerCase())
    );

    const commandsInvalid = inputCommands.filter(v =>
        !commands.some(({ name }) => name.toLowerCase() === v.toLowerCase())
    );

    // 3️⃣ Nenhum comando válido
    if (commandsValid.length === 0) {
        if (commandsInvalid.length > 0) {
            return {
                message: `❌ Nenhum comando válido encontrado.\nOs seguintes são inválidos: ${commandsInvalid.join(', ')}`
            };
        }
        return {
            message: `⚠️ Use o formato: !${commandCall} [comando]\nExemplo: !${commandCall} ping\nDigite !help para mais informações.`
        };
    }

    const groups = getCol('groups');
    let group = await groups.findOne({ group_id });

    if (group) {
        const arrayTarget = admin ? 'admin_commands' : 'allowed_commands';
        const anotherArrayTarget = admin ? 'allowed_commands' : 'admin_commands';

        const updatedCommands = Array.from(new Set([
            ...(group[arrayTarget] || []),
            ...commandsValid
        ]));

        const updatedCommandsAnother = Array.from(new Set([
            ...(group[anotherArrayTarget] || []),
        ])).filter(cmd => !commandsValid.includes(cmd));

        await groups.updateOne(
            { group_id },
            {
                $set: {
                    [arrayTarget]: updatedCommands,
                    [anotherArrayTarget]: updatedCommandsAnother
                }
            }
        );

        return {
            message: `✅ Comandos adicionados ao grupo:\n${commandsValid.join(', ')}`
        };
    }

    await groups.insertOne({
        group_id,
        created_at: new Date(),
        ...(admin
            ? { admin_commands: commandsValid }
            : { allowed_commands: commandsValid }
        )
    });


    return {
        message: `🆕 Grupo registrado e comandos permitidos:\n${commandsValid.join(', ')}`
    };
}
