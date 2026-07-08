# AI Conversational Calendar Assistant Bot 🛡️💬

Bot Discord berbasis Node.js yang berfungsi sebagai asisten kalender pribadi dengan kepribadian Piccolo (dari Dragon Ball) sebagai mentormu. Bot ini memanfaatkan Gemini AI untuk memahami obrolan alamimu (Natural Language) secara cerdas dan otomatis mencatat jadwal kegiatanmu ke Google Calendar melalui n8n.

## Fitur Utama
* **Interaksi Percakapan Alami (Conversational AI)**: Tidak ada lagi perintah kaku (`!tambah`, `!daftar`). Cukup mengobrol langsung seperti manusia, dan AI akan mengerti maksudmu.
* **Deteksi Waktu Pintar (Smart Date Parsing)**: AI secara cerdas menghitung arti kata relatif seperti *"besok"*, *"nanti malam"*, *"minggu depan jam 1 siang"* berdasarkan zona waktu Jakarta (+07:00).
* **Otomatisasi Google Calendar**: Setiap kali kamu meminta pengingat atau pencatatan jadwal, bot otomatis menembakkan data ke n8n untuk dibuatkan event di Google Calendar.
* **Tanggapan Ala Piccolo**: Memberikan jawaban tegas, bijaksana, dan disiplin khas Namekian untuk memotivasimu.
* **24/7 Deployment Ready**: Siap dijalankan tanpa henti di VPS menggunakan PM2 atau Docker Compose.

---

## Persiapan & Konfigurasi

1. **Buat file `.env`**:
   Salin file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Isi data berikut:
   * `DISCORD_TOKEN`: Token bot Discord milikmu.
   * `CHANNEL_ID`: ID Channel tempat bot akan merespon obrolan.
   * `GEMINI_API_KEY`: API Key Gemini (Dapatkan gratis di [Google AI Studio](https://aistudio.google.com/)).
   * `N8N_WEBHOOK_URL`: URL Webhook n8n milikmu (lihat panduan integrasi di bawah).

---

## Cara Menjalankan secara Lokal

1. **Instal Dependensi**:
   ```bash
   npm install
   ```

2. **Jalankan Bot**:
   ```bash
   npm start
   ```

---

## Contoh Cara Berinteraksi

Kirimkan pesan obrolan biasa di channel Discord target:

* **Pencatatan Jadwal Otomatis**:
  * *"Piccolo, tolong jadwalkan besok jam 10 pagi ada rapat dengan dosen selama 1 jam"*
  * *"Nanti malam jam 8 saya mau belajar coding selama 2 jam"*
  * *"Senin depan jam 2 siang ingatkan ada janji ke dokter"*
* **Konsultasi & Obrolan Biasa**:
  * *"Saya lelah sekali hari ini, rasanya ingin bermalas-malasan saja"*
  * *"Bagaimana strategi terbaik untuk meningkatkan fokus belajar?"*

---

## Cara Menjalankan di VPS (24/7)

### Opsi 1: Menggunakan PM2
1. Instal PM2:
   ```bash
   npm install -g pm2
   ```
2. Jalankan bot:
   ```bash
   pm2 start index.js --name "ai-scheduler-bot"
   ```
3. Simpan konfigurasi restart otomatis:
   ```bash
   pm2 startup
   pm2 save
   ```

### Opsi 2: Menggunakan Docker Compose
1. Bangun dan jalankan container di background:
   ```bash
   docker compose up -d --build
   ```
2. Cek status logs:
   ```bash
   docker compose logs -f
   ```
