import { commands } from "../../commands/commands.js";
import { getCol } from "../mongodb.js";

/**
 * Remove permissões de comandos específicos em um grupo do WhatsApp.
 * 
 * @param {string} group_id - ID do grupo do WhatsApp.
 * @param {string} args - Texto contendo os comandos (ex: "ai ping imagem").
 * @returns {Promise<{ message: string }>} Mensagem com o resultado da operação.
 */
export default async function disallowGroup(group_id, args) {
    const inputCommands = args
        .split(' ')
        .map(v => v.trim().replaceAll(',', ''))
        .filter(v => v.length > 0);

    const commandsValid = inputCommands.filter(v =>
        commands.some(({ name }) => name.toLowerCase() === v.toLowerCase())
    );

    const commandsInvalid = inputCommands.filter(v =>
        !commands.some(({ name }) => name.toLowerCase() === v.toLowerCase())
    );

    if (commandsValid.length === 0) {
        if (commandsInvalid.length > 0) {
            return {
                message: `❌ Nenhum comando válido encontrado.\nOs seguintes são inválidos: ${commandsInvalid.join(', ')}`
            };
        }
        return {
            message: '⚠️ Use o formato: !dgp [comando]\nExemplo: !dgp ping\nDigite !help para mais informações.'
        };
    }

    const groups = getCol('groups');
    const group = await groups.findOne({ group_id });

    if (!group) {
        return {
            message: '🚫 Este grupo ainda não possui comandos registrados.\nUse *!agp [comando]* para adicionar permissões.'
        };
    }

    const allowed = group.allowed_commands || [];
    const admin = group.admin_commands || [];

    const updatedAllowed = allowed.filter(cmd => !commandsValid.includes(cmd));
    const updatedAdmin = admin.filter(cmd => !commandsValid.includes(cmd));

    const removed = [
        ...allowed.filter(cmd => commandsValid.includes(cmd)),
        ...admin.filter(cmd => commandsValid.includes(cmd))
    ];

    if (removed.length === 0) {
        return {
            message: '⚠️ Nenhum dos comandos informados está atualmente permitido neste grupo.'
        };
    }

    await groups.updateOne(
        { group_id },
        { $set: { allowed_commands: updatedAllowed, admin_commands: updatedAdmin } }
    );

    return {
        message: `🗑️ Comandos removidos deste grupo:\n${[...new Set(removed)].join(', ')}`
    };
}
