import { ref, push, onValue } from "firebase/database";
import { db } from "../firebase/config";

const getMessagesRef = (eventId) => {
  return ref(db, `chats/${eventId}/messages`);
};

export const chatServices = {
  sendMessage: async ({ eventId, senderId, senderType, content }) => {
    const messagesRef = getMessagesRef(eventId);

    return push(messagesRef, {
      sender_id: senderId,
      sender_type: senderType,
      content: content.trim(),
      created_at: Date.now(),
    });
  },

  subscribeMessages: (eventId, callback) => {
    const messagesRef = getMessagesRef(eventId);

    return onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        callback([]);
        return;
      }

      const messages = Object.entries(data)
        .map(([id, message]) => ({
          id,
          ...message,
        }))
        .sort((a, b) => a.created_at - b.created_at);

      callback(messages);
    });
  },
};