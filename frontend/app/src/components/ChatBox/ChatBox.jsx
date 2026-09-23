import { useEffect, useMemo, useState } from "react";

import {
  FaRegCommentDots,
  FaPaperPlane,
  FaTimes,
} from "react-icons/fa";

import { useEvent } from "../../context/EventContext";
import { useAuth } from "../../context/AuthContext";

import { chatServices } from "../../services/chat.service";
import { eventService } from "../../services/eventService";

const ChatBox = () => {
  const { eventDetail } = useEvent();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);

  const [isChatboxEnabled, setIsChatboxEnabled] =
    useState(false);

  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([]);

  const [chatLoading, setChatLoading] =
    useState(false);

  const eventId = eventDetail?.id;

  const userId = user?.id;

  /*
   * ==========================================
   * LẤY ORGANIZER ID
   * ==========================================
   *
   * Ưu tiên creator_id.
   *
   * Nếu API event của bạn dùng company.id
   * thì fallback sang company.id.
   */
  const organizerId =
    eventDetail?.creator_id ??
    eventDetail?.creator?.id ??
    eventDetail?.company?.id ??
    null;

  const companyName =
    eventDetail?.company?.name ||
    eventDetail?.creator?.name ||
    "Đơn vị tổ chức";

  /*
   * ==========================================
   * LẤY TRẠNG THÁI CHATBOX
   * ==========================================
   */
  useEffect(() => {
    if (!eventId) {
      setIsChatboxEnabled(false);
      setIsOpen(false);
      return;
    }

    let cancelled = false;

    const fetchChatboxStatus = async () => {
      try {
        const response =
          await eventService.getChatboxStatus(
            eventId
          );

        if (cancelled) return;

        const data =
          response?.data ?? response;

        const enabled =
          data?.is_chatbox_enabled === true;

        setIsChatboxEnabled(enabled);

        if (!enabled) {
          setIsOpen(false);
        }
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Failed to get chatbox status:",
          error
        );

        setIsChatboxEnabled(false);
        setIsOpen(false);
      }
    };

    fetchChatboxStatus();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  /*
   * ==========================================
   * REALTIME MESSAGE
   * ==========================================
   */
  useEffect(() => {
    if (
      !eventId ||
      !userId ||
      !organizerId ||
      !isChatboxEnabled
    ) {
      setMessages([]);
      return;
    }

    const unsubscribe =
      chatServices.subscribeMessages(
        eventId,
        (data) => {
          /*
           * User chỉ xem conversation của mình
           */
          const myMessages = data.filter(
            (item) => {
              const isMyMessage =
                Number(item.sender_id) ===
                Number(userId) &&
                item.sender_type === "user";

              const isOrganizerMessage =
                Number(item.sender_id) ===
                  Number(organizerId) &&
                item.sender_type ===
                  "organizer" &&
                Number(item.receiver_id) ===
                  Number(userId);

              return (
                isMyMessage ||
                isOrganizerMessage
              );
            }
          );

          setMessages(myMessages);
        }
      );

    return unsubscribe;
  }, [
    eventId,
    userId,
    organizerId,
    isChatboxEnabled,
  ]);

  /*
   * ==========================================
   * GỬI MESSAGE
   * ==========================================
   */
  const handleSend = async () => {
    const text = message.trim();

    if (
      !text ||
      !eventId ||
      !userId ||
      !organizerId ||
      !isChatboxEnabled ||
      chatLoading
    ) {
      return;
    }

    try {
      setChatLoading(true);

      await chatServices.sendMessage({
        eventId,

        senderId: userId,
        senderType: "user",

        receiverId: organizerId,
        receiverType: "organizer",

        content: text,
      });

      setMessage("");
    } catch (error) {
      console.error(
        "Send user message error:",
        error
      );
    } finally {
      setChatLoading(false);
    }
  };

  /*
   * ==========================================
   * ENTER ĐỂ GỬI
   * ==========================================
   */
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      handleSend();
    }
  };

  /*
   * ==========================================
   * KHÔNG ĐỦ DỮ LIỆU
   * ==========================================
   */
  if (
    !eventId ||
    !userId ||
    !organizerId ||
    !isChatboxEnabled
  ) {
    return null;
  }

  return (
    <>
      {/* =====================================
          FLOATING BUTTON
      ====================================== */}
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

      {/* =====================================
          CHAT WINDOW
      ====================================== */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[500px] w-[360px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1b1c1d] shadow-2xl">

          {/* HEADER */}
          <div className="flex h-16 shrink-0 items-center justify-between bg-[#ff985c] px-4 text-white">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
                <FaRegCommentDots size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[13px] font-semibold leading-5">
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

          {/* MESSAGES */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-[#111213] p-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <FaRegCommentDots
                    className="mx-auto mb-3 text-white/50"
                    size={28}
                  />

                  <p className="text-sm font-medium text-white/80">
                    Chưa có tin nhắn nào
                  </p>

                  <p className="mt-1 text-xs text-white/50">
                    Bạn có thể gửi tin nhắn để
                    được hỗ trợ
                  </p>
                </div>
              </div>
            ) : (
              messages.map((item) => {
                const isUser =
                  item.sender_type === "user" &&
                  Number(item.sender_id) ===
                    Number(userId);

                return (
                  <div
                    key={item.id}
                    className={`flex ${
                      isUser
                        ? "justify-end"
                        : "justify-start"
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

          {/* INPUT */}
          <div className="flex shrink-0 gap-2 border-t border-white/10 bg-[#1b1c1d] p-3">
            <input
              type="text"
              value={message}
              onChange={(e) =>
                setMessage(e.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn..."
              disabled={chatLoading}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#242526] px-3.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-[#ff985c] disabled:opacity-50"
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={
                !message.trim() ||
                chatLoading
              }
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