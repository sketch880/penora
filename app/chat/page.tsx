"use client";

import { useEffect, useState, useRef, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Send, Paperclip, Loader2, ArrowRight, File, Check } from "lucide-react";
import { formatFileSize, getFileExtension } from "@/lib/utils";

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("request");
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [settings, setSettings] = useState({
    max_file_size_mb: 10,
    allowed_formats: "pdf,doc,docx,jpg,png,zip",
  });
  const [request, setRequest] = useState<any>(null);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  const loadMessages = useCallback(async () => {
    if (!requestId) return;

    // اول بدون join امتحان می‌کنیم تا مطمئن شویم پیام‌ها می‌آیند
    const { data, error: msgError } = await supabase
      .from("messages")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });

    if (msgError) {
      console.error("load messages error:", msgError);
      setError(msgError.message);
      return;
    }

    // پروفایل فرستنده‌ها را جداگانه می‌گیریم
    const senderIds = Array.from(new Set((data || []).map((m: any) => m.sender_id)));
    let profilesMap: Record<string, any> = {};

    if (senderIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, full_name, role")
        .in("id", senderIds);

      if (profiles) {
        profiles.forEach((p: any) => {
          profilesMap[p.id] = p;
        });
      }
    }

    const enriched = (data || []).map((m: any) => ({
      ...m,
      profiles: profilesMap[m.sender_id] || null,
    }));

    setMessages(enriched);
    scrollToBottom();
  }, [requestId, supabase, scrollToBottom]);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUser(user);

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(prof);

      if (!requestId) {
        setError("شناسه درخواست مشخص نیست");
        setLoading(false);
        return;
      }

      const { data: req, error: reqError } = await supabase
        .from("requests")
        .select("*, profiles!user_id(username, full_name)")
        .eq("id", requestId)
        .single();

      if (reqError) {
        // fallback
        const { data: simpleReq } = await supabase
          .from("requests")
          .select("*")
          .eq("id", requestId)
          .single();
        setRequest(simpleReq);
      } else {
        setRequest(req);
      }

      const { data: sett } = await supabase
        .from("settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (sett) setSettings(sett);

      await loadMessages();
      setLoading(false);
    };

    init();

    // Realtime
    if (!requestId) return;

    const channel = supabase
      .channel(`messages-${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `request_id=eq.${requestId}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;

          // اگر خودمون فرستادیم و قبلاً optimistic اضافه کردیم، تکرار نکن
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;

            // پروفایل فرستنده را اضافه کن
            return [
              ...prev,
              {
                ...newMsg,
                profiles:
                  newMsg.sender_id === user?.id
                    ? { username: profile?.username, full_name: profile?.full_name, role: profile?.role }
                    : null,
              },
            ];
          });

          // اگر پروفایل نداشت، بعداً لود کن
          if (newMsg.sender_id !== user?.id) {
            const { data: p } = await supabase
              .from("profiles")
              .select("id, username, full_name, role")
              .eq("id", newMsg.sender_id)
              .single();
            if (p) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === newMsg.id ? { ...m, profiles: p } : m
                )
              );
            }
          }

          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || sending || !requestId || !user) return;

    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);
    setError("");

    // Optimistic UI — فوری نشان بده
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      request_id: requestId,
      sender_id: user.id,
      content,
      type: "text",
      created_at: new Date().toISOString(),
      profiles: {
        username: profile?.username,
        full_name: profile?.full_name,
        role: profile?.role,
      },
      _optimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToBottom();

    // تنظیم ارتفاع textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const { data, error: insertError } = await supabase
      .from("messages")
      .insert({
        request_id: requestId,
        sender_id: user.id,
        content,
        type: "text",
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("send error:", insertError);
      setError("خطا در ارسال پیام: " + insertError.message);
      // حذف optimistic
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(content); // برگرداندن متن
    } else if (data) {
      // جایگزین کردن temp با پیام واقعی
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? {
                ...data,
                profiles: {
                  username: profile?.username,
                  full_name: profile?.full_name,
                  role: profile?.role,
                },
              }
            : m
        )
      );
    }

    setSending(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !requestId || !user) return;

    const maxBytes = settings.max_file_size_mb * 1024 * 1024;
    if (file.size > maxBytes) {
      alert(`حجم فایل نباید بیشتر از ${settings.max_file_size_mb} مگابایت باشد`);
      return;
    }

    const ext = getFileExtension(file.name);
    const allowed = settings.allowed_formats
      .split(",")
      .map((f: string) => f.trim().toLowerCase());
    if (!allowed.includes(ext)) {
      alert(`فرمت فایل مجاز نیست. فرمت‌های مجاز: ${settings.allowed_formats}`);
      return;
    }

    setUploading(true);
    setError("");

    const fileName = `${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(fileName, file);

    if (uploadError) {
      console.error(uploadError);
      alert("خطا در آپلود فایل: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("uploads")
      .getPublicUrl(fileName);

    const { data, error: insertError } = await supabase
      .from("messages")
      .insert({
        request_id: requestId,
        sender_id: user.id,
        content: file.name,
        type: "file",
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: ext,
      })
      .select("*")
      .single();

    if (insertError) {
      setError("خطا در ذخیره فایل: " + insertError.message);
    } else if (data) {
      setMessages((prev) => [
        ...prev,
        {
          ...data,
          profiles: {
            username: profile?.username,
            full_name: profile?.full_name,
            role: profile?.role,
          },
        },
      ]);
      scrollToBottom();
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
    setNewMessage(el.value);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  const backHref =
    profile?.role === "admin"
      ? "/admin"
      : profile?.role === "support" || profile?.role === "writer"
      ? "/support"
      : "/dashboard";

  const otherName =
    request?.profiles?.full_name ||
    request?.profiles?.username ||
    "کاربر";

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 h-[calc(100vh-5rem)] flex flex-col">
      {/* هدر چت */}
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-soft-sand shrink-0">
        <button
          onClick={() => router.push(backHref)}
          className="p-2 rounded-full hover:bg-soft-mist text-gray-500 transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {(request?.title || "چ")[0]}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-semibold text-gray-900 truncate text-sm sm:text-base">
            {request?.title || "گفتگو"}
          </h1>
          <p className="text-xs text-gray-500 truncate">
            {profile?.role === "user" ? "پشتیبانی Penora" : otherName}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-2 p-2.5 rounded-xl bg-red-50 text-red-600 text-xs text-center shrink-0">
          {error}
        </div>
      )}

      {/* لیست پیام‌ها */}
      <div className="flex-1 overflow-y-auto px-1 space-y-3 mb-3 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-2">
            <div className="w-16 h-16 rounded-full bg-soft-cream flex items-center justify-center">
              <Send className="w-7 h-7 text-gray-300" />
            </div>
            <p>هنوز پیامی ارسال نشده</p>
            <p className="text-xs">اولین پیام را بنویسید</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMe = msg.sender_id === user?.id;
          const showDate =
            idx === 0 ||
            new Date(msg.created_at).toDateString() !==
              new Date(messages[idx - 1].created_at).toDateString();

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-4">
                  <span className="text-[11px] text-gray-400 bg-soft-cream px-3 py-1 rounded-full">
                    {new Date(msg.created_at).toLocaleDateString("fa-IR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                </div>
              )}

              <div className={`flex ${isMe ? "justify-start" : "justify-end"}`}>
                <div
                  className={`relative max-w-[80%] sm:max-w-[70%] px-3.5 py-2.5 shadow-sm ${
                    isMe
                      ? "bg-primary-500 text-white rounded-2xl rounded-br-md"
                      : "bg-white border border-soft-sand text-gray-800 rounded-2xl rounded-bl-md"
                  }`}
                >
                  {/* نام فرستنده (فقط برای پیام طرف مقابل) */}
                  {!isMe && (
                    <p className="text-[11px] font-semibold text-primary-600 mb-1">
                      {msg.profiles?.full_name ||
                        msg.profiles?.username ||
                        (msg.profiles?.role === "admin" || msg.profiles?.role === "support"
                          ? "پشتیبانی"
                          : "کاربر")}
                    </p>
                  )}

                  {msg.type === "file" ? (
                    <a
                      href={msg.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2.5 ${
                        isMe ? "text-white" : "text-primary-700"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isMe ? "bg-primary-400/40" : "bg-primary-50"
                        }`}
                      >
                        <File className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate max-w-[160px]">
                          {msg.content}
                        </p>
                        <p
                          className={`text-[11px] ${
                            isMe ? "text-primary-100" : "text-gray-400"
                          }`}
                        >
                          {formatFileSize(msg.file_size || 0)}
                        </p>
                      </div>
                    </a>
                  ) : (
                    <p className="text-[13px] sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                  )}

                  <div
                    className={`flex items-center gap-1 mt-1 ${
                      isMe ? "justify-start" : "justify-end"
                    }`}
                  >
                    <span
                      className={`text-[10px] ${
                        isMe ? "text-primary-100" : "text-gray-400"
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString("fa-IR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isMe && !msg._optimistic && (
                      <Check className="w-3 h-3 text-primary-100" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* ورودی پیام */}
      <div className="shrink-0">
        <form
          onSubmit={handleSend}
          className="flex items-end gap-2 bg-white rounded-2xl border border-soft-sand p-1.5 shadow-soft"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2.5 rounded-xl text-gray-400 hover:bg-soft-mist hover:text-primary-600 transition-colors disabled:opacity-50 shrink-0"
            title="ارسال فایل"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </button>

          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={autoResize}
            placeholder="پیام خود را بنویسید..."
            rows={1}
            className="flex-1 resize-none px-2 py-2.5 text-sm bg-transparent focus:outline-none max-h-[120px] leading-5"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
        <p className="text-[10px] text-gray-400 mt-1.5 text-center">
          حداکثر {settings.max_file_size_mb}MB · {settings.allowed_formats}
        </p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
