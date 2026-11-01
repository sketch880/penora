import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-white border-t border-soft-sand mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <span className="text-lg font-bold text-gray-800">Penora</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              پلتفرم تخصصی نگارش مقاله علمی، پایان‌نامه و ویرایش متون دانشگاهی با ارتباط مستقیم با نویسندگان حرفه‌ای.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">دسترسی سریع</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-500 hover:text-primary-600 transition-colors">
                  صفحه اصلی
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-gray-500 hover:text-primary-600 transition-colors">
                  خدمات
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="text-gray-500 hover:text-primary-600 transition-colors">
                  ثبت‌نام
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="text-gray-500 hover:text-primary-600 transition-colors">
                  ورود
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">تماس با ما</h4>
            <p className="text-sm text-gray-500 leading-relaxed">
              برای سوالات و پشتیبانی می‌توانید از طریق پنل کاربری با نویسندگان در ارتباط باشید.
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-soft-sand flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Penora. تمامی حقوق محفوظ است.
          </p>
          <p className="text-xs text-gray-400">
            ساخته شده با دقت و آرامش
          </p>
        </div>
      </div>
    </footer>
  );
}
