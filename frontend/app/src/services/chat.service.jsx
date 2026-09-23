import {
  ref,
  push,
  onValue,
} from "firebase/database";

import { db } from "../firebase/config";

const getMessagesRef = (eventId) => {
  return ref(db, `chats/${eventId}/messages`);
};

export const chatServices = {
  /**
   * Gửi tin nhắn
   */
  sendMessage: async ({
    eventId,
    senderId,
    senderType,
    receiverId,
    receiverType,
    content,
  }) => {
    if (!eventId) {
      throw new Error("eventId is required");
    }

    if (!senderId) {
      throw new Error("senderId is required");
    }

    if (!receiverId) {
      throw new Error("receiverId is required");
    }

    if (!content?.trim()) {
      throw new Error("content is required");
    }

    const messagesRef = getMessagesRef(eventId);

    return push(messagesRef, {
      event_id: Number(eventId),

      sender_id: Number(senderId),
      sender_type: senderType,

      receiver_id: Number(receiverId),
      receiver_type: receiverType,

      content: content.trim(),

      created_at: Date.now(),
    });
  },

  /**
   * Lắng nghe toàn bộ tin nhắn của event
   */
  subscribeMessages: (eventId, callback) => {
    if (!eventId) {
      callback([]);
      return () => {};
    }

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
        .sort(
          (a, b) =>
            Number(a.created_at || 0) -
            Number(b.created_at || 0)
        );

      callback(messages);
    });
  },
};