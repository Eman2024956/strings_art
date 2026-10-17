# دليل التشغيل والنشر | String Art Studio Guide

هذا الدليل يوضح خطوات:
1. التشغيل المحلي (**Localhost**).
2. التشغيل عبر **Docker Compose**.
3. نشر المشروع على **Vercel** والربط مع سيرفر الباك إند.
4. رفع المشروع وتحديثه على **GitHub**.

---

## 1. التشغيل المحلي (Localhost)

يتطلب التطبيق تشغيل خادمين معاً:

### أ) خادم الباك إند (Python FastAPI):
افتح نافذة طرفية (Terminal 1) في مجلد المشروع الرئيسي:
```bash
# تفعيل البيئة الافتراضية
source .venv/bin/activate

# تشغيل خادم الـ API
TASK_ALWAYS_EAGER=true uvicorn app.main:app --app-dir backend --port 8000 --reload
```
> يعمل الـ API على: `http://127.0.0.1:8000`

### ب) خادم الواجهة الأمامية (Next.js):
افتح نافذة طرفية ثانية (Terminal 2):
```bash
cd frontend
npm install
npm run dev
```
> افتح المتصفح على: `http://localhost:3000`

---

## 2. التشغيل عبر Docker Compose

لتشغيل المنظومة كاملة بضغطة زر واحدة (Next.js + FastAPI + Celery + Redis):

```bash
# بناء وتشغيل الحاويات
docker compose up --build
```
- **الواجهة**: `http://localhost:3000`
- **الـ API**: `http://localhost:8000`
- **التخزين الدائم**: مجلد `string_art_data` لحفظ الصور وقوالب الطباعة.

---

## 3. النشر على Vercel (Deployment)

تعتمد البنية الإنتاجية المثالية على:
- **Next.js Frontend** على **Vercel**.
- **Python Backend** على خادم سحابي مستمر مثل **Render.com** أو **Railway.app** أو **VPS**.

### الخطوة 1: نشر الباك إند (على Render كمثال مجاني):
1. سجل دخول في [Render.com](https://render.com) واضغط **New Web Service**.
2. اربط مستودع GitHub: `https://github.com/Eman2024956/strings_art.git`.
3. اضبط الإعدادات التالية:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. أضف متغير بيئة (Environment Variable):
   - `TASK_ALWAYS_EAGER` = `true`
5. احصل على رابط الـ API بعد انتهاء النشر، مثلاً:
   `https://string-art-api.onrender.com`

### الخطوة 2: نشر الواجهة على Vercel:
1. ادخل إلى [Vercel.com](https://vercel.com) واضغط **Add New Project**.
2. اختر مستودع `strings_art`.
3. في إعدادات المشروع قبل الضغط على Deploy:
   - اضغط **Edit** بجانب **Root Directory** وحدد المجلد: `frontend`.
   - اترك **Framework Preset** على: `Next.js`.
4. في قسم **Environment Variables** أضف المتغير:
   - **Key**: `BACKEND_URL`
   - **Value**: رابط الباك إند من الخطوة السابقة (مثل `https://string-art-api.onrender.com`).
5. اضغط **Deploy**.

*(يقوم Next.js تلقائياً عبر `next.config.mjs` بإعادة توجيه كافة طلبات `/api/*` إلى خادم الباك إند بسلاسة ودون مشاكل CORS).*

---

## 4. إعداد ورفع المشروع إلى GitHub

المستودع الهدف:
👉 `https://github.com/Eman2024956/strings_art.git`

نفّذ الأوامر التالية من مجلد المشروع الرئيسي:

```bash
# 1. تهيئة مستودع Git
git init

# 2. إضافة جميع الملفات (مع استبعاد الملفات المهملة في .gitignore)
git add .

# 3. حفظ الـ Commit الأول
git commit -m "feat: complete string art generator studio with Next.js, FastAPI, and exports"

# 4. تحديد الفرع الرئيسي main
git branch -M main

# 5. ربط المستودع البعيد
git remote add origin https://github.com/Eman2024956/strings_art.git

# 6. رفع الكود
git push -u origin main
```

> **ملاحظة**: إذا كان المستودع على GitHub يحتوي مسبقاً على ملفات (مثل README أولي)، يمكنك استخدام:
> ```bash
> git pull origin main --rebase
> git push -u origin main
> ```
> أو للرفع القسري إذا كنت تريد استبدال محتويات المستودع بالكامل:
> ```bash
> git push -u origin main --force
> ```
