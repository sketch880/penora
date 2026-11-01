"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Shield,
  Users,
  FileText,
  Settings,
  Loader2,
  Save,
  CheckCircle,
  MessageCircle,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    max_file_size_mb: 10,
    allowed_formats: "pdf,doc,docx,jpg,png,zip",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"settings" | "users" | "requests">("requests");
  const [errorMsg, setErrorMsg] = useState("");
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

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

      if (!prof || prof.role !== "admin") {
        router.push("/dashboard");
        return;
      }
      setProfile(prof);

      // کاربران
      const { data: allUsers, error: usersError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (usersError) console.error("users error:", usersError);
      setUsers(allUsers || []);

      // درخواست‌ها — با join صحیح
      const { data: allReqs, error: reqsError } = await supabase
        .from("requests")
        .select("*, profiles!user_id(username, full_name, email)")
        .order("created_at", { ascending: false });

      if (reqsError) {
        console.error("requests error:", reqsError);
        // fallback بدون join
        const { data: simpleReqs } = await supabase
          .from("requests")
          .select("*")
          .order("created_at", { ascending: false });
        setRequests(simpleReqs || []);
        setErrorMsg(reqsError.message);
      } else {
        setRequests(allReqs || []);
      }

      const { data: sett } = await supabase
        .from("settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (sett) {
        setSettings({
          max_file_size_mb: sett.max_file_size_mb,
          allowed_formats: sett.allowed_formats,
        });
      }

      setLoading(false);
    };
    init();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    setSaved(false);

    const { error } = await supabase.from("settings").upsert({
      id: 1,
      max_file_size_mb: Number(settings.max_file_size_mb),
      allowed_formats: settings.allowed_formats,
      updated_at: new Date().toISOString(),
    });

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  const updateRequestStatus = async (id: string, status: string) => {
    await supabase.from("requests").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    setUpdatingRole(userId);
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (!error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } else {
      alert("خطا در تغییر نقش: " + error.message);
    }
    setUpdatingRole(null);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  const roleLabel = (role: string) => {
    switch (role) {
      case "admin": return "مدیر";
      case "support": return "پشتیبان";
      case "writer": return "نویسنده";
      default: return "کاربر";
    }
  };

  const roleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-purple-50 text-purple-700";
      case "support": return "bg-teal-50 text-teal-700";
      case "writer": return "bg-blue-50 text-blue-700";
      default: return "bg-gray-50 text-gray-600";
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">پنل مدیریت</h1>
          <p className="text-sm text-gray-500">کنترل سایت، کاربران و پشتیبانی</p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 text-amber-800 text-sm">
          هشدار کوئری درخواست‌ها: {errorMsg}
        </div>
      )}

      <div className="flex gap-2 mb-8 border-b border-soft-sand pb-1 overflow-x-auto">
        {[
          { id: "requests", label: "درخواست‌ها", icon: FileText },
          { id: "users", label: "کاربران و نقش‌ها", icon: Users },
          { id: "settings", label: "تنظیمات فایل", icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-white text-primary-700 border border-soft-sand border-b-white -mb-px"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "settings" && (
        <div className="bg-white rounded-2xl border border-soft-sand shadow-soft p-6 max-w-lg">
          <h2 className="font-semibold text-gray-900 mb-5">محدودیت آپلود فایل</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                حداکثر حجم فایل (مگابایت)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={settings.max_file_size_mb}
                onChange={(e) =>
                  setSettings({ ...settings, max_file_size_mb: Number(e.target.value) })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-soft-sand focus:border-primary-300 focus:ring-2 focus:ring-primary-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                فرمت‌های مجاز (با کاما جدا کنید)
              </label>
              <input
                type="text"
                value={settings.allowed_formats}
                onChange={(e) =>
                  setSettings({ ...settings, allowed_formats: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-soft-sand focus:border-primary-300 focus:ring-2 focus:ring-primary-100 text-sm"
                dir="ltr"
                placeholder="pdf,doc,docx,jpg,png,zip"
              />
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 disabled:opacity-60 transition-colors"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saved ? "ذخیره شد" : "ذخیره تنظیمات"}
            </button>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="bg-white rounded-2xl border border-soft-sand shadow-soft overflow-hidden">
          <div className="px-6 py-4 border-b border-soft-sand">
            <h2 className="font-semibold text-gray-900">کاربران ({users.length})</h2>
            <p className="text-xs text-gray-500 mt-1">
              برای تعریف پشتیبان: نقش کاربر را به «پشتیبان» تغییر دهید. آن کاربر با همان ایمیل و رمز خود وارد شود و به پنل پشتیبانی دسترسی پیدا می‌کند.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-soft-cream text-gray-600">
                <tr>
                  <th className="text-right px-6 py-3 font-medium">نام کاربری</th>
                  <th className="text-right px-6 py-3 font-medium">نام کامل</th>
                  <th className="text-right px-6 py-3 font-medium">ایمیل</th>
                  <th className="text-right px-6 py-3 font-medium">نقش</th>
                  <th className="text-right px-6 py-3 font-medium">تغییر نقش</th>
                  <th className="text-right px-6 py-3 font-medium">تاریخ عضویت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soft-sand">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-soft-cream/40">
                    <td className="px-6 py-3 font-medium text-gray-900" dir="ltr">
                      {u.username}
                    </td>
                    <td className="px-6 py-3 text-gray-600">{u.full_name || "—"}</td>
                    <td className="px-6 py-3 text-gray-500 text-xs" dir="ltr">
                      {u.email || "—"}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColor(u.role)}`}>
                        {roleLabel(u.role)}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <select
                        value={u.role}
                        disabled={updatingRole === u.id || u.id === profile?.id}
                        onChange={(e) => updateUserRole(u.id, e.target.value)}
                        className="px-2 py-1.5 rounded-lg border border-soft-sand text-xs focus:border-primary-300 disabled:opacity-50"
                      >
                        <option value="user">کاربر</option>
                        <option value="support">پشتیبان</option>
                        <option value="writer">نویسنده</option>
                        <option value="admin">مدیر</option>
                      </select>
                      {updatingRole === u.id && (
                        <Loader2 className="w-3 h-3 inline-block mr-1 animate-spin text-primary-500" />
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs">
                      {new Date(u.created_at).toLocaleDateString("fa-IR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "requests" && (
        <div className="bg-white rounded-2xl border border-soft-sand shadow-soft overflow-hidden">
          <div className="px-6 py-4 border-b border-soft-sand flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">درخواست‌ها ({requests.length})</h2>
          </div>
          <div className="divide-y divide-soft-sand">
            {requests.map((req) => (
              <div key={req.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900">{req.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {req.profiles?.full_name || req.profiles?.username || "کاربر"}
                    {req.profiles?.email ? ` · ${req.profiles.email}` : ""}
                    {" · "}
                    {new Date(req.created_at).toLocaleDateString("fa-IR")}
                  </p>
                  {req.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{req.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/chat?request=${req.id}`}
                    className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
                    title="چت"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Link>
                  <select
                    value={req.status}
                    onChange={(e) => updateRequestStatus(req.id, e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-soft-sand text-sm focus:border-primary-300"
                  >
                    <option value="pending">در انتظار</option>
                    <option value="in_progress">در حال انجام</option>
                    <option value="completed">تکمیل شده</option>
                  </select>
                </div>
              </div>
            ))}
            {requests.length === 0 && (
              <div className="p-8 text-center text-gray-400 text-sm">
                درخواستی وجود ندارد.
                <br />
                <span className="text-xs mt-2 block">
                  اگر مشتری درخواست ثبت کرده ولی اینجا نیست: ۱) مطمئن شوید نقش شما admin است ۲) اسکیما و RLS جدید را در Supabase اجرا کنید.
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
