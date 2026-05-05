export function getChats() {
  return [
    {
      chatId: 1,
      username: "mijinseooo",
      profileImageUrl: "https://randomuser.me/api/portraits/women/17.jpg",
      online: true,
      lastMessage: "야 뭐해?",
      messages: [
        { messageId: 1, fromMe: false, text: "야 뭐해?" },
        { messageId: 2, fromMe: true, text: "나 이제 일어남 ㅋㅋ" },
      ],
    },
  ];
}

export function sendMessage(chatId, text) {
  return { chatId, message: { messageId: Date.now(), fromMe: true, text } };
}

