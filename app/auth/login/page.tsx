"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("ایمیل یا رمز عبور اشتباه است");
      setLoading(false);
      return;
    }

    // هدایت بر اساس نقش
    if (data.user) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (prof?.role === "admin") {
        router.push("/admin");
      } else if (prof?.role === "support" || prof?.role === "writer") {
        router.push("/support");
      } else {
        router.push("/dashboard");
      }
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mx-auto mb-4 shadow-soft">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ورود به Penora</h1>
          <p className="text-gray-500 mt-2 text-sm">به حساب کاربری خود وارد شوید</p>
        </div>

        <div className="bg-white rounded-2xl shadow-soft-lg border border-soft-sand/50 p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                ایمیل
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-soft-sand bg-soft-cream/50 focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all text-sm pl-12"
                  placeholder="••••••••"
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
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed btn-soft"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  ورود
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            حساب ندارید؟{" "}
            <Link href="/auth/register" className="text-primary-600 font-medium hover:underline">
              ثبت‌نام کنید
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
