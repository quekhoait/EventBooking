import { useEffect, useMemo, useState } from "react";

import {
  FaPaperPlane,
  FaRegCommentDots,
  FaSearch,
  FaArrowLeft,
} from "react-icons/fa";

import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import { chatServices } from "../../services/chat.service";

function OrganizerChatPage() {
  const { eventId } = useParams();

  const navigate = useNavigate();

  const { user } = useAuth();

  const [messages, setMessages] = useState([]);

  const [selectedUserId, setSelectedUserId] = useState(null);

  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");

  const [sending, setSending] = useState(false);

  /*
   * ==========================================
   * LẮNG NGHE TẤT CẢ MESSAGE CỦA EVENT
   * ==========================================
   */
  useEffect(() => {
    if (!eventId) {
      setMessages([]);
      return;
    }

    const unsubscribe = chatServices.subscribeMessages(eventId, (data) => {
      setMessages(data);
    });

    return unsubscribe;
  }, [eventId]);

  /*
   * ==========================================
   * TẠO DANH SÁCH USER
   * ==========================================
   *
   * User gửi:
   *
   * sender_id = user
   *
   * Organizer gửi:
   *
   * receiver_id = user
   *
   */
  const conversations = useMemo(() => {
    const map = new Map();

    messages.forEach((item) => {
      let userId = null;

      if (item.sender_type === "user") {
        userId = item.sender_id;
      }

      if (item.sender_type === "organizer" && item.receiver_type === "user") {
        userId = item.receiver_id;
      }

      if (!userId) {
        return;
      }

      const id = String(userId);

      if (!map.has(id)) {
        map.set(id, {
          id,
          messages: [],
          lastMessage: "",
          lastTime: 0,
        });
      }

      const conversation = map.get(id);

      conversation.messages.push(item);

      conversation.lastMessage = item.content;

      conversation.lastTime = Number(item.created_at || 0);
    });

    return Array.from(map.values()).sort((a, b) => b.lastTime - a.lastTime);
  }, [messages]);

  /*
   * ==========================================
   * CONVERSATION ĐANG CHỌN
   * ==========================================
   */
  const selectedConversation = useMemo(() => {
    if (!selectedUserId) {
      return null;
    }

    return conversations.find(
      (item) => String(item.id) === String(selectedUserId),
    );
  }, [conversations, selectedUserId]);

  /*
   * ==========================================
   * SEARCH USER
   * ==========================================
   */
  const filteredConversations = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return conversations;
    }

    return conversations.filter((item) =>
      String(item.id).toLowerCase().includes(keyword),
    );
  }, [conversations, search]);

  /*
   * ==========================================
   * GỬI MESSAGE
   * ==========================================
   */
  const handleSend = async () => {
    const text = message.trim();

    if (!text || !eventId || !user?.id || !selectedUserId || sending) {
      return;
    }

    try {
      setSending(true);

      await chatServices.sendMessage({
        eventId,

        senderId: user.id,
        senderType: "organizer",

        receiverId: selectedUserId,
        receiverType: "user",

        content: text,
      });

      setMessage("");
    } catch (error) {
      console.error("Send organizer message error:", error);
    } finally {
      setSending(false);
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

  return (
    <div className="flex h-full min-h-[850px] overflow-hidden rounded-2xl border border-white/10 bg-[#0d0e0f] text-white shadow-2xl">
      {/* ================= SIDEBAR ================= */}
      <aside className="flex w-[320px] shrink-0 flex-col border-r border-white/10 bg-[#171819]">
        {/* HEADER */}
        <div className="border-b border-white/10 bg-[#1b1c1d] p-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition hover:border-[#ff985c]/40 hover:bg-[#ff985c]/10 hover:text-[#ff985c]"
            >
              <FaArrowLeft size={14} />
            </button>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff985c] text-white shadow-lg shadow-[#ff985c]/20">
              <FaRegCommentDots size={19} />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-bold uppercase tracking-wide">
                Tin nhắn
              </h2>

              <p className="mt-0.5 text-[11px] text-white/40">
                Event #{eventId}
              </p>
            </div>
          </div>

          {/* SEARCH */}
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-[#242526] px-3 transition focus-within:border-[#ff985c]/50">
            <FaSearch size={13} className="shrink-0 text-white/30" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo ID user..."
              className="h-10 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            />
          </div>
        </div>

        {/* CONVERSATION LIST */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <div>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
                  <FaRegCommentDots size={25} className="text-white/20" />
                </div>

                <p className="text-sm font-medium text-white/40">
                  Chưa có người dùng nhắn tin
                </p>

                <p className="mt-1 text-xs text-white/20">
                  Các cuộc trò chuyện sẽ xuất hiện ở đây
                </p>
              </div>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const active = String(selectedUserId) === String(conversation.id);

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedUserId(conversation.id)}
                  className={`group flex w-full gap-3 border-b border-white/5 p-4 text-left transition ${
                    active ? "bg-[#ff985c]/10" : "hover:bg-white/[0.04]"
                  }`}
                >
                  {/* AVATAR */}
                  <div
                    className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                      active
                        ? "bg-[#ff985c] text-white shadow-lg shadow-[#ff985c]/20"
                        : "bg-[#2b2c2d] text-white/60 group-hover:bg-[#343536]"
                    }`}
                  >
                    U
                    {active && (
                      <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#171819] bg-[#ff985c]" />
                    )}
                  </div>

                  {/* INFO */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`truncate text-sm font-semibold ${
                          active ? "text-[#ff985c]" : "text-white"
                        }`}
                      >
                        User #{conversation.id}
                      </p>

                      {/* SỐ TIN NHẮN */}
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          active
                            ? "bg-[#ff985c] text-white"
                            : "bg-white/10 text-white/40"
                        }`}
                      >
                        {conversation.messages.length}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-xs text-white/35">
                      {conversation.lastMessage}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ================= CHAT ================= */}
      <main className="flex min-w-0 flex-1 flex-col bg-[#0d0e0f]">
        {!selectedConversation ? (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-[#171819] shadow-xl">
              <FaRegCommentDots size={34} className="text-[#ff985c]" />
            </div>

            <h3 className="text-lg font-semibold text-white/80">
              Tin nhắn sự kiện
            </h3>

            <p className="mt-2 text-sm text-white/35">
              Chọn một người dùng để bắt đầu trò chuyện
            </p>
          </div>
        ) : (
          <>
            {/* CHAT HEADER */}
            <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/10 bg-[#171819] px-6">
              <div className="flex items-center gap-3">
                <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#ff985c] text-sm font-bold shadow-lg shadow-[#ff985c]/20">
                  U
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#171819] bg-green-400" />
                </div>

                <div>
                  <h3 className="text-sm font-bold">
                    User #{selectedConversation.id}
                  </h3>

                  <p className="mt-0.5 text-[11px] text-green-400">
                    Đang trong cuộc trò chuyện
                  </p>
                </div>
              </div>

              {/* TOTAL MESSAGE */}
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-right">
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/30">
                  Tin nhắn
                </p>

                <p className="mt-0.5 text-sm font-bold text-[#ff985c]">
                  {selectedConversation.messages.length}
                </p>
              </div>
            </header>

            {/* MESSAGE AREA */}
            <div className="flex-1 space-y-4 overflow-y-auto bg-[#0d0e0f] p-6">
              {selectedConversation.messages.map((item) => {
                const isOrganizer =
                  item.sender_type === "organizer" &&
                  Number(item.sender_id) === Number(user?.id);

                return (
                  <div
                    key={item.id}
                    className={`flex ${
                      isOrganizer ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] ${
                        isOrganizer ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`mb-1 px-1 text-[9px] font-medium uppercase tracking-wider text-white/20 ${
                          isOrganizer ? "text-right" : "text-left"
                        }`}
                      >
                        {isOrganizer
                          ? "Bạn"
                          : `User #${selectedConversation.id}`}
                      </div>

                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg ${
                          isOrganizer
                            ? "rounded-br-md bg-[#ff985c] text-white shadow-[#ff985c]/10"
                            : "rounded-bl-md border border-white/10 bg-[#242526] text-white/80"
                        }`}
                      >
                        {item.content}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* INPUT */}
            <div className="border-t border-white/10 bg-[#171819] p-4">
              <div className="flex gap-3 rounded-2xl border border-white/10 bg-[#242526] p-2 transition focus-within:border-[#ff985c]/40">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                  placeholder="Nhập tin nhắn cho người dùng..."
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/30 disabled:opacity-50"
                />

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!message.trim() || sending}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ff985c] text-white shadow-lg shadow-[#ff985c]/20 transition hover:scale-105 hover:bg-[#ff7f3d] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
                  aria-label="Gửi tin nhắn"
                >
                  <FaPaperPlane size={14} />
                </button>
              </div>

              <p className="mt-2 px-2 text-[10px] text-white/20">
                Nhấn Enter để gửi tin nhắn
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default OrganizerChatPage;
