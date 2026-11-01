"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, UserPlus, Loader2, CheckCircle, XCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const checkUsername = async (username: string) => {
    if (username.length < 3) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username.toLowerCase())
      .maybeSingle();

    setUsernameStatus(data ? "taken" : "available");
  };

  const handleUsernameChange = (value: string) => {
    const cleaned = value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
    setForm({ ...form, username: cleaned });
    if (cleaned.length >= 3) {
      const timeout = setTimeout(() => checkUsername(cleaned), 400);
      return () => clearTimeout(timeout);
    } else {
      setUsernameStatus("idle");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (form.username.length < 3) {
      setError("نام کاربری باید حداقل ۳ کاراکتر باشد");
      setLoading(false);
      return;
    }

    if (usernameStatus === "taken") {
      setError("نام کاربری وجود دارد. لطفاً نام دیگری انتخاب کنید.");
      setLoading(false);
      return;
    }

    // Final check
    const { data: existing } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", form.username.toLowerCase())
      .maybeSingle();

    if (existing) {
      setError("نام کاربری وجود دارد");
      setUsernameStatus("taken");
      setLoading(false);
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          username: form.username.toLowerCase(),
          full_name: form.fullName,
        },
      },
    });

    if (authError) {
      if (authError.message.includes("already registered")) {
        setError("این ایمیل قبلاً ثبت شده است");
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    if (authData.user) {
      // Profile is usually created by a trigger, but we ensure it
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: authData.user.id,
        username: form.username.toLowerCase(),
        full_name: form.fullName,
        email: form.email,
        role: "user",
      });

      if (profileError && !profileError.message.includes("duplicate")) {
        console.error(profileError);
      }
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mx-auto mb-4 shadow-soft">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ثبت‌نام در Penora</h1>
          <p className="text-gray-500 mt-2 text-sm">حساب کاربری جدید بسازید</p>
        </div>

        <div className="bg-white rounded-2xl shadow-soft-lg border border-soft-sand/50 p-8">
          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                نام کاربری
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  required
                  minLength={3}
                  maxLength={20}
                  className="w-full px-4 py-3 rounded-xl border border-soft-sand bg-soft-cream/50 focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all text-sm pl-10"
                  placeholder="مثال: ali_reza"
                  dir="ltr"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  {usernameStatus === "checking" && (
                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                  )}
                  {usernameStatus === "available" && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  {usernameStatus === "taken" && (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
              {usernameStatus === "taken" && (
                <p className="mt-1.5 text-xs text-red-500">نام کاربری وجود دارد</p>
              )}
              {usernameStatus === "available" && (
                <p className="mt-1.5 text-xs text-green-600">نام کاربری در دسترس است</p>
              )}
              <p className="mt-1 text-xs text-gray-400">فقط حروف انگلیسی، عدد و _ (حداقل ۳ کاراکتر)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                نام و نام خانوادگی
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl border border-soft-sand bg-soft-cream/50 focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all text-sm"
                placeholder="علی رضایی"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                ایمیل
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl border border-soft-sand bg-soft-cream/50 focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all text-sm"
                placeholder="email@example.com"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                رمز عبور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-soft-sand bg-soft-cream/50 focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all text-sm pl-12"
                  placeholder="حداقل ۶ کاراکتر"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || usernameStatus === "taken" || usernameStatus === "checking"}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed btn-soft"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  ثبت‌نام
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            قبلاً ثبت‌نام کرده‌اید؟{" "}
            <Link href="/auth/login" className="text-primary-600 font-medium hover:underline">
              وارد شوید
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
