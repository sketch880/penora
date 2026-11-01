import Link from "next/link";
import { FileText, Edit3, MessageCircle, Shield, Upload, Users, CheckCircle, ArrowLeft } from "lucide-react";

export default function HomePage() {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-primary-50 via-soft-cream to-soft-beige opacity-80" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              نگارش حرفه‌ای و آرامش‌بخش
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              مقاله‌ات را با
              <span className="text-primary-600"> Penora </span>
              بنویس
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto">
              پلتفرم تخصصی نوشتن مقاله علمی، پایان‌نامه و ویرایش متون دانشگاهی.
              ارتباط مستقیم با نویسندگان حرفه‌ای، آپلود امن فایل و پیگیری آسان.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-primary-500 text-white font-semibold shadow-soft-lg hover:bg-primary-600 transition-all btn-soft"
              >
                شروع رایگان
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-gray-700 font-semibold border border-soft-sand shadow-soft hover:border-primary-200 hover:text-primary-700 transition-all"
              >
                مشاهده خدمات
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">چرا Penora؟</h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              همه چیز برای یک تجربه نگارش آرام و حرفه‌ای طراحی شده است
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: FileText,
                title: "نگارش مقاله و پایان‌نامه",
                desc: "نویسندگان متخصص در رشته‌های مختلف آماده نوشتن و تکمیل مقالات علمی شما هستند.",
              },
              {
                icon: Edit3,
                title: "ویرایش تخصصی",
                desc: "ویرایش زبانی، علمی و ساختاری متون دانشگاهی با دقت بالا و استانداردهای بین‌المللی.",
              },
              {
                icon: MessageCircle,
                title: "ارتباط مستقیم",
                desc: "چت آنلاین با نویسنده داخل سایت. سوال بپرسید، فایل بفرستید و پیشرفت کار را دنبال کنید.",
              },
              {
                icon: Upload,
                title: "آپلود امن فایل",
                desc: "ارسال PDF، Word، عکس و هر فرمت مورد نیاز. کنترل حجم و فرمت توسط مدیر سایت.",
              },
              {
                icon: Shield,
                title: "حریم خصوصی",
                desc: "اطلاعات و فایل‌های شما محرمانه می‌ماند. حساب کاربری امن با نام کاربری یکتا.",
              },
              {
                icon: Users,
                title: "نویسندگان حرفه‌ای",
                desc: "تیمی از نویسندگان و ویراستاران با تجربه دانشگاهی و پژوهشی.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-soft-cream border border-soft-sand/50 hover:border-primary-200 hover:shadow-soft transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-soft-mist/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">چطور کار می‌کند؟</h2>
            <p className="text-gray-600">در چند قدم ساده شروع کنید</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "۱", title: "ثبت‌نام", desc: "حساب کاربری بسازید با نام کاربری یکتا" },
              { step: "۲", title: "درخواست", desc: "نوع خدمت و جزئیات را مشخص کنید" },
              { step: "۳", title: "ارتباط", desc: "با نویسنده چت کنید و فایل‌ها را ارسال کنید" },
              { step: "۴", title: "دریافت", desc: "کار نهایی را دریافت و بررسی کنید" },
            ].map((item, i) => (
              <div key={i} className="text-center relative">
                <div className="w-14 h-14 rounded-full bg-primary-500 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4 shadow-soft">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
                {i < 3 && (
                  <div className="hidden md:block absolute top-7 left-0 w-full h-0.5 bg-primary-200 -z-10 translate-x-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl bg-gradient-to-l from-primary-500 to-primary-600 p-10 md:p-14 text-center text-white shadow-soft-lg">
            <h2 className="text-3xl font-bold mb-4">آماده شروع هستید؟</h2>
            <p className="text-primary-100 mb-8 max-w-lg mx-auto">
              همین حالا ثبت‌نام کنید و اولین درخواست نگارش یا ویرایش خود را ثبت کنید.
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-primary-700 font-semibold hover:bg-primary-50 transition-colors shadow-soft"
            >
              ثبت‌نام رایگان
              <CheckCircle className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
