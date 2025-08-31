# # ✨ LannzAI

[![HTML](https://img.shields.io/badge/language-HTML-blue.svg)](https://www.w3.org/html/)
[![NPM](https://img.shields.io/badge/npm-install-green.svg)](https://www.npmjs.com/)


> Aplikasi web sederhana yang dikembangkan menggunakan HTML.  Ini menyediakan antarmuka pengguna dasar untuk berinteraksi dengan chatbot AI.

## ✨ Fitur Utama

* **Antarmuka pengguna berbasis HTML:**  Aplikasi web ini memiliki antarmuka pengguna yang dirancang menggunakan HTML yang bersih dan intuitif.
* **Penggunaan Aset Gambar:**  Penggunaan `bot-avatar.png` dan `user-avatar.png` menunjukkan penambahan unsur visual untuk meningkatkan pengalaman pengguna.
* **Fungsionalitas Chatbot:** File `api/chat.js` mengindikasikan adanya fungsionalitas chatbot yang memungkinkan pengguna untuk berinteraksi dengan AI.  Detail spesifik tentang kemampuan AI tersebut membutuhkan pemeriksaan lebih lanjut terhadap kode `chat.js`.
* **Styling CSS:**  File `style.css` digunakan untuk menerapkan gaya visual pada aplikasi web.


## 🛠️ Tumpukan Teknologi

| Kategori       | Teknologi | Catatan                                      |
|-----------------|------------|----------------------------------------------|
| Bahasa Pemrograman | HTML        | Bahasa markup untuk pengembangan antarmuka pengguna. |
| Styling         | CSS         | Untuk styling dan layout antarmuka pengguna.      |
| Manajemen Paket  | npm         | Untuk instalasi dependensi.                     |
| API (Diperkirakan) | JavaScript (Diduga) | Berdasarkan nama file `api/chat.js`   |


## 🏛️ Tinjauan Arsitektur

Arsitektur aplikasi ini nampaknya mengikuti struktur sederhana dengan pemisahan file berdasarkan fungsionalitas: `api` untuk logika chatbot, `assets` untuk gambar, `index.html` sebagai file utama antarmuka pengguna, dan `style.css` untuk styling.  Detail lebih lanjut membutuhkan pemeriksaan kode sumber yang mendalam.


## 🚀 Memulai

1. **Kloning repositori:**
   ```bash
   git clone https://github.com/Lannnnnzzzzzzzzzzz/lannzAI.git
   cd lannzAI
   ```

2. **Instalasi dependensi:**
   ```bash
   npm install
   ```

3. **Menjalankan server pengembangan:**
   ```bash
   npm run dev
   ```


## 📂 Struktur File

```
/
├── LICENSE
├── README.md
├── api
│   └── chat.js
├── assets
│   ├── bot-avatar.png
│   └── user-avatar.png
├── index.html
└── style.css
```

* **/api/**:  Mengandung logika server-side untuk chatbot.
* **/assets/**:  Berisi aset statis seperti gambar.
* **index.html**: File utama yang berisi HTML untuk antarmuka pengguna.
* **style.css**: File yang berisi CSS untuk styling antarmuka pengguna.

