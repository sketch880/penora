"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Menu, X, User, LogOut, LayoutDashboard, Shield, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from("profiles").select("*").eq("id", session.user.id).single()
          .then(({ data }) => setProfile(data));
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const navLinks = [
    { href: "/", label: "صفحه اصلی" },
    { href: "/services", label: "خدمات" },
    { href: "/#how-it-works", label: "نحوه کار" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-soft-sand/60 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-soft group-hover:shadow-md transition-shadow">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-bold text-gray-800 tracking-tight">
              Penora
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:text-primary-600 hover:bg-soft-mist"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                {profile?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="p-2 rounded-lg text-gray-500 hover:bg-soft-mist hover:text-primary-600 transition-colors"
                    title="پنل مدیریت"
                  >
                    <Shield className="w-5 h-5" />
                  </Link>
                )}
                {(profile?.role === "support" || profile?.role === "writer" || profile?.role === "admin") && (
                  <Link
                    href="/support"
                    className="p-2 rounded-lg text-gray-500 hover:bg-soft-mist hover:text-teal-600 transition-colors"
                    title="پنل پشتیبانی"
                  >
                    <Headphones className="w-5 h-5" />
                  </Link>
                )}
                <Link
                  href={profile?.role === "admin" ? "/admin" : (profile?.role === "support" || profile?.role === "writer") ? "/support" : "/dashboard"}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-soft-mist transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>{profile?.username || "حساب کاربری"}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                  title="خروج"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
                >
                  ورود
                </Link>
                <Link
                  href="/auth/register"
                  className="px-5 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-medium shadow-soft hover:bg-primary-600 transition-all btn-soft"
                >
                  ثبت‌نام رایگان
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-soft-mist"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-soft-sand bg-white animate-fade-in">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "block px-4 py-3 rounded-lg text-sm font-medium",
                  pathname === link.href
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-soft-mist"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-soft-sand mt-3 space-y-2">
              {user ? (
                <>
                  <Link
                    href={profile?.role === "admin" ? "/admin" : (profile?.role === "support" || profile?.role === "writer") ? "/support" : "/dashboard"}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-soft-mist"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    داشبورد
                  </Link>
                  {profile?.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-soft-mist"
                    >
                      <Shield className="w-4 h-4" />
                      پنل مدیریت
                    </Link>
                  )}
                  {(profile?.role === "support" || profile?.role === "writer" || profile?.role === "admin") && (
                    <Link
                      href="/support"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-soft-mist"
                    >
                      <Headphones className="w-4 h-4" />
                      پنل پشتیبانی
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    خروج
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-soft-mist"
                  >
                    ورود
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 rounded-xl bg-primary-500 text-white text-sm font-medium text-center"
                  >
                    ثبت‌نام رایگان
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
