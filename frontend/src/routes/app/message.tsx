import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Send, Loader2, MessageSquare, RefreshCw } from "lucide-react";
import { DashHeading } from "@/components/dashboard/DashboardShell";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

export const Route = createFileRoute("/app/message")({
  ssr: false,
  validateSearch: z.object({
    userId: z.string().optional(),
    userName: z.string().optional(),
    userAvatar: z.string().optional(),
  }),
  component: MessagePage,
});

interface ConvUser {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
}

interface Conversation {
  user: ConvUser;
  lastMessage: string;
  updatedAt: string;
}

interface ChatMessage {
  _id: string;
  senderId: { _id: string; name: string; avatar?: string; companyName?: string };
  receiverId: { _id: string; name: string; avatar?: string; companyName?: string };
  text: string;
  createdAt: string;
}

function getAvatar(user?: { avatar?: string; name?: string; id?: string }) {
  if (user?.avatar) return user.avatar;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=random&size=80`;
}

function MessagePage() {
  const { session } = useAuth();
  const { userId: paramUserId, userName: paramUserName, userAvatar: paramUserAvatar } = Route.useSearch();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeUser, setActiveUser] = useState<ConvUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialized = useRef(false);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get("/messages/conversations");
      const list: Conversation[] = res.data.conversations || [];
      setConversations(list);
      return list;
    } catch {
      return [];
    } finally {
      setLoadingConv(false);
    }
  }, []);

  const fetchThread = useCallback(async (userId: string) => {
    setLoadingMessages(true);
    try {
      const res = await api.get(`/messages/thread/${userId}`);
      setMessages(res.data.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const startPolling = useCallback((userId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/messages/thread/${userId}`);
        setMessages(res.data.messages || []);
      } catch {}
    }, 5000);
  }, []);

  // On mount: load conversations, then open the seller if userId was passed in
  useEffect(() => {
    const init = async () => {
      const list = await fetchConversations();

      if (!initialized.current) {
        initialized.current = true;

        if (paramUserId) {
          // Find the seller in existing conversations or build a stub user
          const found = list.find((c) => c.user.id === paramUserId);
          const user: ConvUser = found?.user ?? {
            id: paramUserId,
            name: paramUserName || "Seller",
            avatar: paramUserAvatar || undefined,
            role: "product",
          };

          // If not in conversation list yet, add them to the top so they're visible
          if (!found) {
            setConversations((prev) => [
              {
                user,
                lastMessage: "Start a conversation",
                updatedAt: new Date().toISOString(),
              },
              ...prev,
            ]);
          }

          setActiveUser(user);
        } else if (list.length > 0) {
          setActiveUser(list[0].user);
        }
      }
    };
    init();

    const convPoll = setInterval(fetchConversations, 15000);
    return () => {
      clearInterval(convPoll);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (activeUser?.id) {
      fetchThread(activeUser.id);
      startPolling(activeUser.id);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeUser?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !activeUser || sending) return;

    const textToSend = draft.trim();
    setDraft("");
    setSending(true);

    const tempMsg: ChatMessage = {
      _id: `temp-${Date.now()}`,
      senderId: {
        _id: session?.id || "me",
        name: session?.name || "Me",
        avatar: session?.avatar,
        companyName: session?.companyName,
      },
      receiverId: {
        _id: activeUser.id,
        name: activeUser.name,
        avatar: activeUser.avatar,
      },
      text: textToSend,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await api.post("/messages", {
        receiverId: activeUser.id,
        text: textToSend,
      });
      const realMsg = res.data.message;
      if (realMsg) {
        setMessages((prev) => prev.map((m) => (m._id === tempMsg._id ? realMsg : m)));
      }
      // Update lastMessage in conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c.user.id === activeUser.id
            ? { ...c, lastMessage: textToSend, updatedAt: new Date().toISOString() }
            : c
        )
      );
    } catch {
      toast.error("Failed to send message");
      setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
      setDraft(textToSend);
    } finally {
      setSending(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    if (activeUser?.id) await fetchThread(activeUser.id);
    setRefreshing(false);
  };

  const selectUser = (user: ConvUser) => {
    setActiveUser(user);
    setMessages([]);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <DashHeading
          title="Messages"
          subtitle="Chat with buyers, sellers, and service providers in real time."
        />
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="Refresh messages"
          className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* ── Conversations Sidebar ── */}
        <div className="space-y-2">
          {loadingConv ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="rounded-2xl border border-border p-6 text-center text-sm text-muted-foreground">
              <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="font-medium">No conversations yet</p>
              <p className="mt-1 text-xs">Conversations will appear here after you send or receive a message.</p>
            </div>
          ) : (
            conversations.map((c) => {
              const selected = activeUser?.id === c.user.id;
              return (
                <button
                  key={c.user.id}
                  onClick={() => selectUser(c.user)}
                  className={`flex w-full items-center gap-3.5 rounded-2xl p-3.5 text-left transition-colors ${
                    selected
                      ? "bg-brand-soft border border-brand/30"
                      : "hover:bg-muted border border-transparent"
                  }`}
                >
                  <img
                    src={getAvatar(c.user)}
                    alt={c.user.name}
                    className="h-11 w-11 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{c.user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.lastMessage === "Start a conversation" ? (
                        <span className="italic text-price">New — start chatting!</span>
                      ) : (
                        c.lastMessage
                      )}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* ── Chat Thread Panel ── */}
        <div className="flex min-h-[500px] flex-col rounded-2xl border border-border shadow-sm bg-background">
          {activeUser ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-border p-4">
                <img
                  src={getAvatar(activeUser)}
                  alt={activeUser.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-sm">{activeUser.name}</p>
                  <span className="text-xs text-muted-foreground capitalize">
                    {activeUser.role === "buyer"
                      ? "Buyer"
                      : activeUser.role === "product"
                      ? "Seller"
                      : activeUser.role || "User"}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
                {loadingMessages ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                    <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-2" />
                    <p className="text-sm font-medium">No messages yet</p>
                    <p className="text-xs mt-1">
                      Send a message to {activeUser.name.split(" ")[0]} to start your conversation!
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe =
                      m.senderId?._id === session?.id || m.senderId?._id === "me";
                    const senderName =
                      m.senderId?.companyName || m.senderId?.name || "User";
                    return (
                      <div
                        key={m._id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        {!isMe && (
                          <div className="flex items-center gap-2 mb-1">
                            <img
                              src={getAvatar({
                                avatar: m.senderId?.avatar,
                                name: senderName,
                                id: m.senderId?._id,
                              })}
                              alt={senderName}
                              className="h-6 w-6 rounded-full object-cover"
                            />
                            <span className="text-xs text-muted-foreground">{senderName}</span>
                          </div>
                        )}
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                            isMe
                              ? "bg-ink text-ink-foreground rounded-br-none"
                              : "bg-muted text-foreground rounded-bl-none"
                          }`}
                        >
                          {m.text}
                        </div>
                        <span className="mt-1 text-[11px] text-muted-foreground px-1">
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input */}
              <form
                onSubmit={handleSend}
                className="flex items-center gap-3 border-t border-border p-4"
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={`Message ${activeUser.name.split(" ")[0]}…`}
                  aria-label="Write a message"
                  autoFocus={!!paramUserId}
                  className="min-w-0 flex-1 rounded-xl border border-border px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground/30 transition-colors"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  aria-label="Send message"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-ink-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 p-10 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 text-muted-foreground/20 mb-3" />
              <p className="text-base font-semibold">Select a conversation</p>
              <p className="text-xs mt-1">
                Pick a contact from the left to view your chat history.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
