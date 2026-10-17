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

## 3. النشر على Vercel والربط مع الباك إند (Deployment Guide)

### ⚠️ هام: لماذا يظهر خطأ `404 Not Found` والنقطة الحمراء على Vercel؟
عند نشر الواجهة على Vercel لأول مرة دون ربط خادم بايثون:
1. الواجهة الأمامية تطلب فحص الحالة `/health` ورفع الصور `/api/uploads`.
2. يبحث Vercel عن متغير `BACKEND_URL`؛ فإذا لم يكن موجوداً يحاول الاتصال بـ `127.0.0.1:8000` (الذي هو جهازك المحلي وغير موجود داخل سيرفرات Vercel السحابية)، مما يؤدي لظهور خطأ `404 Not Found` ونقطة حمراء.
3. بمجرد نشر الباك إند على Render وإضافة رابطه كـ `BACKEND_URL` في Vercel، ستتحول النقطة إلى خضراء وتعمل كل ميزات رفع وتوليد اللوحات تماماً كما في Localhost.

---

### ❓ هل يمكن استضافة الباك إند بالكامل داخل Vercel؟ ولماذا لا يُنصح بذلك؟
**السبب تقني بحت يتعلق بطبيعة Vercel Serverless:**
1. **الحد الأقصى للوقت (Timeout)**: خوارزمية فن الخيوط تحسب آلاف المسارات الهندسية (1,000 إلى 8,000 خط) وتستغرق من 15 إلى 45 ثانية. خطة Vercel المجانية تقطع أي طلب يتجاوز **10 ثوانٍ** فوراً!
2. **تخزين الملفات**: يقوم التطبيق بتوليد وحفظ ملفات PDF و SVG و ZIP، وخوادم Vercel تمنع الكتابة على القرص (Read-only filesystem) ولا تحتفظ بالملفات.
3. **الحسابات المكثفة (CPU-Heavy)**: تتطلب مكتبات NumPy و Bresenham معالجاً مستمراً وليس دوال Serverless تنطفئ بعد ثوانٍ.

لذلك، المعمارية القياسية المعتمدة هي:
> **Next.js Frontend على Vercel** + **FastAPI Backend على Render**.

---

### الخطوة 1: نشر الباك إند على Render (الإعدادات وخيارات الأسعار):

#### أ) جدول خطط وأسعار Render (Pricing Plans):
تطبيق فن الخيوط يعتمد على معالجة حسابية مكثفة (CPU-heavy):

| الخطة (Plan) | السعر شهرياً | المعالج (CPU) | الذاكرة (RAM) | التوصية والاستخدام |
|---|---|---|---|---|
| **Free (مجانية)** | **$0** | 0.5 vCPU | 512 MB | • مناسبة للتجربة الأولية.<br>• تنام الخدمة بعد 15 دقيقة خمول (Cold start 40-50 ثانية).<br>• لا تدعم قرص تخزين دائم. |
| **Starter** | **$7** | 0.5 vCPU | 512 MB | • تعمل 24/7 دون توقف (Always-on).<br>• ممتازة للبدء والإنتاج الأولي حتى 3000 خط. |
| **Standard (موصى بها للإنتاج)** | **$25** | 1 vCPU | 2 GB | • **الخيار المثالي للإنتاج الفعلي**.<br>• سرعة مضاعفة في الحساب (3000-8000 خط).<br>• تدعم إضافة قرص تخزين دائم (Persistent Disk). |
| **Pro** | **$85** | 2 vCPU | 4 GB | • للحمل والضغط العالي واستقبال طلبات توليد متزامنة. |

> 💡 **إضافة قرص تخزين دائم (Persistent Disk)**: $0.25 لكل 1GB شهرياً (مثلاً 5GB تكلف $1.25 شهرياً فقط لحفظ ملفات الـ PDF والـ ZIP بعد إعادة تشغيل السيرفر).

---

#### ب) ضبط حقول الخدمة في صفحة Render (Web Services Fields):
عند الضغط على **New ➔ Web Service** في [Render.com](https://render.com) واختيار المستودع:

| اسم الحقل في Render | القيمة المطلوبة | ملاحظات |
|---|---|---|
| **Name** | `string-art-api` | اسم الخدمة ليكون الرابط: `https://string-art-api.onrender.com` |
| **Region** | `Frankfurt (EU Central)` أو `Oregon (US)` | اختر الأقرب لجمهورك (فرانكفورت ممتازة للمنطقة العربية). |
| **Branch** | `main` | الفرع الرئيسي للمستودع. |
| **Root Directory** | `backend` | **ضروري جداً**: لتحديد مجلد الباك إند. |
| **Runtime** | `Python 3` | بيئة التشغيل. |
| **Build Command** | `pip install -r requirements.txt` | تثبيت الاعتماديات (NumPy, Pillow, ReportLab, FastAPI). |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` | أمر إطلاق خادم الـ API. |
| **Instance Type** | `Free` أو `Starter ($7)` أو `Standard ($25)` | اختر الخطة المناسبة. |

#### ج) حقول متغيرات البيئة (Environment Variables):
في نفس الصفحة انزل إلى **Environment Variables** وأضف:
1. `PYTHON_VERSION` = `3.11.0`
2. `TASK_ALWAYS_EAGER` = `true`
3. `CORS_ORIGINS` = `https://your-domain.vercel.app,http://localhost:3000`

#### د) وحدة التخزين الدائم (Disks) - في خطط المدفوعة:
1. اضغط **Add Disk**.
2. **Name**: `string_art_storage`
3. **Mount Path**: `/app/data`
4. **Size**: `1 GB` (أو أكثر).

بعد انتهاء النشر، انسخ رابط السيرفر (مثال: `https://string-art-api.onrender.com`).

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

### حل مشكلة الصلاحيات وتوثيق الحساب (GitHub 403 Permission Denied):
إذا واجهت خطأ 403 أو رغبت في الرفع عبر Personal Access Token:

1. **إنشاء Token بصلاحيات الرفع (Classic Token - الأفضل)**:
   - افتح: [https://github.com/settings/tokens](https://github.com/settings/tokens)
   - اضغط **Generate new token (classic)**.
   - ضع علامة صح (✓) على خيار **`repo`** (Full control of private and public repositories).
   - اضغط **Generate token** وانسخ الرمز الذي يبدأ بـ `ghp_...`.

2. **الرفع باستخدام الـ Token مباشرة**:
   ```bash
   git push https://<YOUR_TOKEN>@github.com/Eman2024956/strings_art.git main
   ```
   أو حفظ الـ Token للمستودع:
   ```bash
   git remote set-url origin https://Eman2024956:<YOUR_TOKEN>@github.com/Eman2024956/strings_art.git
   git push -u origin main
   ```

3. **في حال استخدام Fine-Grained Token (`github_pat_...`)**:
   - تأكد من الدخول لصفحة التوكن وتعديل **Repository permissions**.
   - تغيير صلاحية **Contents** من `No access` إلى **`Read and write`**، حيث أن صلاحية `metadata=read` وحدها لا تسمح بالرفع.
