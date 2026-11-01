"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Headphones,
  FileText,
  Loader2,
  MessageCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default function SupportPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "in_progress" | "completed">("all");

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!prof || !["support", "writer", "admin"].includes(prof.role)) {
        router.push("/dashboard");
        return;
      }
      setProfile(prof);

      const { data: allReqs, error } = await supabase
        .from("requests")
        .select("*, profiles!user_id(username, full_name, email)")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        const { data: simple } = await supabase
          .from("requests")
          .select("*")
          .order("created_at", { ascending: false });
        setRequests(simple || []);
      } else {
        setRequests(allReqs || []);
      }

      setLoading(false);
    };
    init();
  }, []);

  const updateRequestStatus = async (id: string, status: string) => {
    await supabase
      .from("requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  const filtered = filter === "all"
    ? requests
    : requests.filter((r) => r.status === filter);

  const statusMap: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: "در انتظار", color: "bg-amber-50 text-amber-700", icon: Clock },
    in_progress: { label: "در حال انجام", color: "bg-blue-50 text-blue-700", icon: FileText },
    completed: { label: "تکمیل شده", color: "bg-green-50 text-green-700", icon: CheckCircle2 },
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
          <Headphones className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">پنل پشتیبانی</h1>
          <p className="text-sm text-gray-500">
            {profile?.full_name || profile?.username} · مدیریت درخواست‌های مشتریان
          </p>
        </div>
      </div>

      {/* فیلتر */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: "all", label: "همه" },
          { id: "pending", label: "در انتظار" },
          { id: "in_progress", label: "در حال انجام" },
          { id: "completed", label: "تکمیل شده" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f.id
                ? "bg-primary-500 text-white"
                : "bg-white border border-soft-sand text-gray-600 hover:bg-soft-cream"
            }`}
          >
            {f.label}
            {f.id !== "all" && (
              <span className="mr-1.5 text-xs opacity-70">
                ({requests.filter((r) => r.status === f.id).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-soft-sand shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-soft-sand">
          <h2 className="font-semibold text-gray-900">
            درخواست‌ها ({filtered.length})
          </h2>
        </div>
        <div className="divide-y divide-soft-sand">
          {filtered.map((req) => {
            const st = statusMap[req.status] || statusMap.pending;
            return (
              <div
                key={req.id}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-soft-cream/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">{req.title}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                      <st.icon className="w-3 h-3" />
                      {st.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {req.profiles?.full_name || req.profiles?.username || "کاربر"}
                    {req.profiles?.email ? ` · ${req.profiles.email}` : ""}
                    {" · "}
                    {new Date(req.created_at).toLocaleDateString("fa-IR")}
                    {req.service_type && ` · ${req.service_type}`}
                  </p>
                  {req.description && (
                    <p className="text-sm text-gray-600 mt-1.5 line-clamp-2">{req.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/chat?request=${req.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-50 text-primary-700 text-sm font-medium hover:bg-primary-100 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    چت
                  </Link>
                  <select
                    value={req.status}
                    onChange={(e) => updateRequestStatus(req.id, e.target.value)}
                    className="px-3 py-2 rounded-xl border border-soft-sand text-sm focus:border-primary-300"
                  >
                    <option value="pending">در انتظار</option>
                    <option value="in_progress">در حال انجام</option>
                    <option value="completed">تکمیل شده</option>
                  </select>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-10 text-center text-gray-400 text-sm">
              درخواستی با این فیلتر وجود ندارد.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
