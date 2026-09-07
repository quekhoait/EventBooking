import { useEffect, useState } from "react";
import { FaRegCommentDots, FaPaperPlane, FaTimes } from "react-icons/fa";

import { useEvent } from "../../context/EventContext";
import { useAuth } from "../../context/AuthContext";
import { chatServices } from "../../services/chat.service";
import { eventService } from "../../services/eventService";

const ChatBox = () => {
  const { eventDetail } = useEvent();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isChatboxEnabled, setIsChatboxEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const eventId = eventDetail?.id;
  const userId = user?.id;
  const companyName = eventDetail?.company?.name || "Đơn vị tổ chức";

  // Lấy trạng thái ChatBox từ API
  useEffect(() => {
    if (!eventId) {
      setIsChatboxEnabled(false);
      return;
    }

    const fetchChatboxStatus = async () => {
      try {
        const response = await eventService.getChatboxStatus(eventId);

        const enabled = response?.data?.is_chatbox_enabled === true;

        setIsChatboxEnabled(enabled);

        // Nếu backend tắt chat trong lúc đang mở
        if (!enabled) {
          setIsOpen(false);
        }
      } catch (error) {
        console.error("Failed to get chatbox status:", error);
        setIsChatboxEnabled(false);
        setIsOpen(false);
      }
    };

    fetchChatboxStatus();
  }, [eventId]);

  // Lắng nghe tin nhắn Firebase
  useEffect(() => {
    if (!eventId || !isChatboxEnabled) return;

    const unsubscribe = chatServices.subscribeMessages(eventId, (data) => {
      setMessages(data);
    });

    return unsubscribe;
  }, [eventId, isChatboxEnabled]);

  // Gửi tin nhắn
  const handleSend = async () => {
    const text = message.trim();

    if (!text || !eventId || !userId || !isChatboxEnabled) {
      return;
    }

    try {
      await chatServices.sendMessage({
        eventId,
        senderId: userId,
        senderType: "user",
        content: text,
      });

      setMessage("");
    } catch (error) {
      console.error("Send message error:", error);
    }
  };

  // Enter để gửi
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  // Không có event, user hoặc ChatBox bị tắt
  if (!eventId || !userId || !isChatboxEnabled) {
    return null;
  }

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center">
         <span className="relative mb-2 rounded-lg border border-[#ff985c]/30 bg-[#ff985c] px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg shadow-[#ff985c]/20">
            Hỗ trợ
            <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-[#ff985c]" />
          </span>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-[#ff985c] text-white shadow-lg transition hover:scale-105 hover:bg-[#ff8540] active:scale-95"
            aria-label="Mở chat hỗ trợ"
          >
            <FaRegCommentDots size={25} />
          </button>
        </div>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[500px] w-[360px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1b1c1d] shadow-2xl">
          {/* Header */}
          <div className="flex h-16 shrink-0 items-center justify-between bg-[#ff985c] px-4 text-white">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
                <FaRegCommentDots size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[13px] font-semibold leading-5 text-white">
                  {companyName}
                </h3>

                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/80" />

                  <span className="truncate text-[11px] font-medium text-white/75">
                    Hỗ trợ sự kiện
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white transition hover:bg-white/20"
              aria-label="Đóng chat"
            >
              <FaTimes size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-[#111213] p-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-sm text-white/40">
                <div className="text-center text-white/70">
                  <FaRegCommentDots
                    className="mx-auto mb-3 text-white/50"
                    size={28}
                  />

                  <p className="text-sm font-medium text-white/80">
                    Chưa có tin nhắn nào
                  </p>

                  <p className="mt-1 text-xs text-white/50">
                    Bạn có thể gửi tin nhắn để được hỗ trợ
                  </p>
                </div>
              </div>
            ) : (
              messages.map((item) => {
                const isUser = item.sender_type === "user";

                return (
                  <div
                    key={item.id}
                    className={`flex ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        isUser
                          ? "rounded-br-sm bg-[#ff985c] text-white"
                          : "rounded-bl-sm border border-white/10 bg-[#242526] text-white/80"
                      }`}
                    >
                      {item.content}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input */}
          <div className="flex shrink-0 gap-2 border-t border-white/10 bg-[#1b1c1d] p-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn..."
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#242526] px-3.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-[#ff985c]"
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={!message.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ff985c] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Gửi tin nhắn"
            >
              <FaPaperPlane size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBox;
