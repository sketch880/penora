-- =============================================
-- Penora Database Schema for Supabase
-- این فایل را در SQL Editor پنل Supabase اجرا کنید
-- (اگر قبلاً اجرا کرده‌اید، فقط بخش‌های جدید را اجرا کنید)
-- =============================================

-- جدول پروفایل کاربران
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'writer', 'support', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- اگر جدول قبلاً ساخته شده، نقش support را اضافه کن
DO $$
BEGIN
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('user', 'writer', 'support', 'admin'));
EXCEPTION WHEN others THEN
  NULL;
END $$;

-- ایندکس برای جستجوی سریع نام کاربری
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx ON profiles (LOWER(username));

-- جدول درخواست‌ها
CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  service_type TEXT DEFAULT 'article',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  writer_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول پیام‌ها (چت)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'file')),
  file_url TEXT,
  file_size BIGINT,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول تنظیمات سایت (برای کنترل حجم و فرمت فایل)
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  max_file_size_mb INTEGER DEFAULT 10,
  allowed_formats TEXT DEFAULT 'pdf,doc,docx,jpg,png,zip',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- مقدار اولیه تنظیمات
INSERT INTO settings (id, max_file_size_mb, allowed_formats)
VALUES (1, 10, 'pdf,doc,docx,jpg,png,zip')
ON CONFLICT (id) DO NOTHING;

-- فعال‌سازی Realtime برای پیام‌ها
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION WHEN others THEN
  NULL;
END $$;

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- حذف سیاست‌های قدیمی برای جلوگیری از تداخل
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

DROP POLICY IF EXISTS "Users can view own requests" ON requests;
DROP POLICY IF EXISTS "Users can create own requests" ON requests;
DROP POLICY IF EXISTS "Admins and writers can update requests" ON requests;
DROP POLICY IF EXISTS "Admins writers and support can update requests" ON requests;

DROP POLICY IF EXISTS "Users can view messages of their requests" ON messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON messages;

DROP POLICY IF EXISTS "Anyone can read settings" ON settings;
DROP POLICY IF EXISTS "Only admin can update settings" ON settings;

-- سیاست‌های profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ادمین می‌تواند نقش هر کاربری را تغییر دهد
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- سیاست‌های requests
CREATE POLICY "Users can view own requests"
  ON requests FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'writer', 'support')
    )
  );

CREATE POLICY "Users can create own requests"
  ON requests FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins writers and support can update requests"
  ON requests FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'writer', 'support')
    )
  );

-- سیاست‌های messages
CREATE POLICY "Users can view messages of their requests"
  ON messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = messages.request_id
      AND (
        r.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role IN ('admin', 'writer', 'support')
        )
      )
    )
  );

CREATE POLICY "Authenticated users can send messages"
  ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- سیاست‌های settings
CREATE POLICY "Anyone can read settings"
  ON settings FOR SELECT USING (true);

CREATE POLICY "Only admin can update settings"
  ON settings FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- تابع برای ساخت خودکار پروفایل بعد از ثبت‌نام
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تریگر
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage Bucket برای فایل‌ها
-- این را از پنل Storage بسازید: نام bucket = uploads

COMMENT ON TABLE profiles IS 'پروفایل کاربران Penora';
COMMENT ON TABLE requests IS 'درخواست‌های نگارش و ویرایش';
COMMENT ON TABLE messages IS 'پیام‌های چت بین کاربر و پشتیبان';
COMMENT ON TABLE settings IS 'تنظیمات سایت از جمله محدودیت فایل';
