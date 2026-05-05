import { getChats } from "./messages.mock.js";

export function MessagesPage() {
  const chats = getChats();
  return <div className="p-6 text-sm text-gray-500">Phase 2 messages placeholder: {chats.length} chats prepared.</div>;
}

