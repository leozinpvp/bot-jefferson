import { createPersistentProxy } from "../../../functions/json.js";

export const inChatBot = createPersistentProxy('chatbot-active', new Set([]));
export const botsHistories = createPersistentProxy('chatbot-histories', {});
