import { endChatBot } from "../chatbot.js";

export const commandsChatBot = [
    {
        name: 'exit',
        family: 'basic',
        fun: endChatBot,
        desc: 'Encerra o chatbot. Exemplo: "!chatbot".'
    }
]