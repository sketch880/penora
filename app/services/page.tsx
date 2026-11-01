import Link from "next/link";
import { FileText, Edit3, BookOpen, Search, CheckCircle } from "lucide-react";

const services = [
  {
    icon: FileText,
    title: "نگارش مقاله علمی",
    desc: "نوشتن مقالات پژوهشی، مروری و کنفرانسی بر اساس استانداردهای ژورنال‌های معتبر.",
    features: ["ساختار علمی استاندارد", "ارجاع‌دهی دقیق", "بازبینی و اصلاح"],
  },
  {
    icon: BookOpen,
    title: "نگارش پایان‌نامه",
    desc: "تکمیل فصل‌های پایان‌نامه کارشناسی، ارشد و دکتری با رعایت اصول دانشگاهی.",
    features: ["فصل‌بندی حرفه‌ای", "تحلیل داده", "نگارش نتیجه و پیشنهاد"],
  },
  {
    icon: Edit3,
    title: "ویرایش علمی و زبانی",
    desc: "ویرایش ساختاری، محتوایی و زبانی متون دانشگاهی و پژوهشی.",
    features: ["ویرایش فارسی و انگلیسی", "اصلاح انسجام", "بررسی منابع"],
  },
  {
    icon: Search,
    title: "مشاوره و راهنمایی",
    desc: "مشاوره در انتخاب موضوع، روش تحقیق و آماده‌سازی برای ارسال به ژورنال.",
    features: ["انتخاب موضوع", "طراحی پژوهش", "آماده‌سازی سابمیت"],
  },
];

export default function ServicesPage() {
  return (
    <div className="animate-fade-in">
      <section className="py-16 bg-gradient-to-b from-primary-50/50 to-soft-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">خدمات Penora</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            مجموعه‌ای کامل از خدمات نگارش و ویرایش علمی برای دانشجویان و پژوهشگران
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-soft-sand/60 p-8 shadow-soft hover:shadow-soft-lg hover:border-primary-200 transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-5">
                  <service.icon className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h2>
                <p className="text-gray-600 mb-5 leading-relaxed">{service.desc}</p>
                <ul className="space-y-2 mb-6">
                  {service.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-primary-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-2 text-primary-600 font-medium text-sm hover:text-primary-700"
                >
                  درخواست این خدمت
                  <span>←</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-white rounded-2xl border border-soft-sand p-8 shadow-soft">
            <h3 className="text-xl font-bold text-gray-900 mb-3">آماده شروع هستید؟</h3>
            <p className="text-gray-600 mb-6 text-sm">
              ثبت‌نام کنید، درخواست خود را ثبت کنید و مستقیماً با نویسنده در ارتباط باشید.
            </p>
            <Link
              href="/auth/register"
              className="inline-flex px-6 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
            >
              ثبت‌نام و شروع
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
