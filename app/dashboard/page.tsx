"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  MessageCircle,
  Upload,
  FileText,
  User,
  Plus,
  Loader2,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { formatFileSize, getFileExtension } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [newRequest, setNewRequest] = useState({ title: "", description: "", service_type: "article" });
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState({ max_file_size_mb: 10, allowed_formats: "pdf,doc,docx,jpg,png,zip" });

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
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

      const { data: reqs } = await supabase
        .from("requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setRequests(reqs || []);

      const { data: sett } = await supabase
        .from("settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (sett) setSettings(sett);

      setLoading(false);
    };
    init();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.from("requests").insert({
      user_id: user.id,
      title: newRequest.title,
      description: newRequest.description,
      service_type: newRequest.service_type,
      status: "pending",
    });

    if (error) {
      alert("خطا در ثبت درخواست: " + error.message);
    } else {
      const { data: reqs } = await supabase
        .from("requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setRequests(reqs || []);
      setShowNewRequest(false);
      setNewRequest({ title: "", description: "", service_type: "article" });
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  const statusMap: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: "در انتظار", color: "bg-amber-50 text-amber-700", icon: Clock },
    in_progress: { label: "در حال انجام", color: "bg-blue-50 text-blue-700", icon: FileText },
    completed: { label: "تکمیل شده", color: "bg-green-50 text-green-700", icon: CheckCircle2 },
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            سلام، {profile?.full_name || profile?.username} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">به داشبورد Penora خوش آمدید</p>
        </div>
        <button
          onClick={() => setShowNewRequest(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors shadow-soft"
        >
          <Plus className="w-4 h-4" />
          درخواست جدید
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-white rounded-2xl border border-soft-sand p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
              <p className="text-xs text-gray-500">کل درخواست‌ها</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-soft-sand p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter((r) => r.status === "pending" || r.status === "in_progress").length}
              </p>
              <p className="text-xs text-gray-500">فعال</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-soft-sand p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter((r) => r.status === "completed").length}
              </p>
              <p className="text-xs text-gray-500">تکمیل شده</p>
            </div>
          </div>
        </div>
      </div>

      {/* New Request Modal */}
      {showNewRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-soft-lg w-full max-w-lg p-6 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-900 mb-5">درخواست جدید</h2>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عنوان</label>
                <input
                  type="text"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-soft-sand focus:border-primary-300 focus:ring-2 focus:ring-primary-100 text-sm"
                  placeholder="مثال: نگارش مقاله ISI"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع خدمت</label>
                <select
                  value={newRequest.service_type}
                  onChange={(e) => setNewRequest({ ...newRequest, service_type: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-soft-sand focus:border-primary-300 focus:ring-2 focus:ring-primary-100 text-sm"
                >
                  <option value="article">نگارش مقاله</option>
                  <option value="thesis">پایان‌نامه</option>
                  <option value="editing">ویرایش</option>
                  <option value="consulting">مشاوره</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
                <textarea
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-soft-sand focus:border-primary-300 focus:ring-2 focus:ring-primary-100 text-sm resize-none"
                  placeholder="جزئیات درخواست خود را بنویسید..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "ثبت درخواست"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewRequest(false)}
                  className="px-5 py-2.5 rounded-xl border border-soft-sand text-gray-600 hover:bg-soft-cream"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Requests List */}
      <div className="bg-white rounded-2xl border border-soft-sand shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-soft-sand">
          <h2 className="font-semibold text-gray-900">درخواست‌های من</h2>
        </div>
        {requests.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">هنوز درخواستی ثبت نکرده‌اید</p>
            <button
              onClick={() => setShowNewRequest(true)}
              className="mt-4 text-primary-600 text-sm font-medium hover:underline"
            >
              اولین درخواست را ثبت کنید
            </button>
          </div>
        ) : (
          <div className="divide-y divide-soft-sand">
            {requests.map((req) => {
              const st = statusMap[req.status] || statusMap.pending;
              const StatusIcon = st.icon;
              return (
                <div key={req.id} className="px-6 py-4 hover:bg-soft-cream/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{req.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{req.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${st.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {st.label}
                      </span>
                      <Link
                        href={`/chat?request=${req.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-xs font-medium hover:bg-primary-100 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        گفتگو
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Info */}
      <div className="mt-8 p-5 rounded-2xl bg-primary-50 border border-primary-100">
        <p className="text-sm text-primary-800">
          <strong>محدودیت آپلود:</strong> حداکثر {settings.max_file_size_mb} مگابایت — فرمت‌های مجاز: {settings.allowed_formats}
        </p>
      </div>
    </div>
  );
}
