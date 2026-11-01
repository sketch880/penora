import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Penora | نگارش حرفه‌ای مقاله و پایان‌نامه",
  description: "پلتفرم تخصصی نوشتن مقاله علمی، پایان‌نامه و ویرایش متون دانشگاهی با ارتباط مستقیم با نویسندگان حرفه‌ای",
  keywords: "نوشتن مقاله, پایان نامه, ویرایش علمی, نگارش دانشگاهی, Penora",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-screen flex flex-col bg-soft-cream">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
