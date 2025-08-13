# member-isaiah-file-uploader
A stripped-down personal storage application similar to Google Drive — built with **Express**, **Prisma**, **Passport.js**, and **Multer**, with support for cloud file storage and shareable folder links.

---

## 🚀 Features

- 🔐 User authentication (Passport.js + sessions)
- 📁 Folder management (CRUD)
- 📤 File upload with `multer`
- 📥 Download and view file details
- ☁️ Cloud storage support (Cloudinary/Supabase)
- 🔗 Shareable links for folders (with expiry)
- 🧾 EJS templating for frontend
- 🗄️ PostgreSQL database with Prisma ORM

---

## 🧱 Tech Stack

- **Backend**: Node.js, Express
- **Database**: PostgreSQL via Prisma
- **Auth**: Passport.js with sessions
- **Storage**: Multer (local), Cloudinary/Supabase (remote)
- **Templating**: EJS
- **Session Store**: Prisma Session Store

---

## 📦 Installation

```bash
git clone https://github.com/agile-learning-institute/member-isaiah-file-uploader
cd drive-app
npm install
```
Create a .env file in the root with:
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/yourdb"
SESSION_SECRET="yoursecret"
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

Migrate Database
npx prisma migrate dev --name init
npx prisma generate

Running the App:

npm run dev