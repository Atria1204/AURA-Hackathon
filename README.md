# 🛡️ A.U.R.A (Autonomous Understanding & Return Agent)
### *Policy-Augmented Generation (PAG) for Multimodal Automated Return & Fraud Detection*

A.U.R.A adalah solusi sistem manajemen klaim dan retur (*Return & Claim Management*) berbasis Agen Inteligensi Multimodal AI yang dikembangkan untuk **AURA Hackathon 2026**. Sistem ini dirancang untuk mengotomatisasi proses validasi keluhan pelanggan secara *real-time*, menekan angka kerugian akibat penipuan retur (*return fraud*), serta membantu pengambil kebijakan (admin) lewat standarisasi keputusan berbasis data yang objektif dan terukur.

---

## 📌 Daftar Isi
1. [Fitur Utama](#fitur)
2. [Arsitektur & Logika Trust Signals (S1-S4)](#arsitektur)
3. [Alur Kerja Sistem (Workflow)](#workflow)
4. [Tech Stack](#tech)
5. [Panduan Instalasi Lokal](#instalasi)
6. [Konfigurasi Environment Variables](#env_var)
7. [Rencana Penyelesaian & Deployment (Production Ready)](#deployment)
8. [Struktur Repositori](#struktur_repo)
9. [Kontributor & Pembagian Peran](#kontributor)

---

## <a id="fitur"></a> ✨ Fitur Utama

* **The Gatekeeper (Validasi Awal Otomatis):** Sistem verifikasi lapis pertama yang mencocokkan nomor resi pelanggan dengan database pesanan (*Order Management System*) sebelum pelanggan diizinkan mengisi form klaim, memblokir potensi *spamming* atau klaim palsu dari bot.
* **Multimodal Vision Inspection:** Menggunakan model **Gemini 2.5 Flash** untuk menginspeksi komponen visual. Sistem membandingkan secara paralel antara **Foto Bukti dari Pelanggan** dengan **Foto Katalog Resmi Toko** guna mendeteksi ketidaksesuaian produk (*mismatch*).
* **Policy-Augmented Generation (PAG):** AI tidak mengeluarkan keputusan secara acak (*hallucination prevention*). Setiap analisis dikunci secara ketat oleh aturan operasional (SOP) toko yang ditanamkan langsung pada arsitektur prompt agen.
* **Intelligence Administrative Dashboard:** Panel kendali admin yang menyajikan visualisasi data klaim masuk, kalkulasi risiko (*Overall Risk Score*), dan visualisasi *track bar* berdasarkan metrik keandalan klaim secara instan tanpa kurasi manual.

---

## <a id="arsitektur"></a> 🧠 Arsitektur & Logika Trust Signals (S1-S4)

Sistem mengevaluasi keabsahan klaim berdasarkan kombinasi 4 pilar sinyal kepatuhan (*Trust Signals Breakdown*) dengan skala risiko yang dipetakan ke dalam dashboard:

| Sinyal | Nama Metrik | Deskripsi Logika Sistem | Status Pengujian |
| :--- | :--- | :--- | :--- |
| **S1** | *Time Gap Analysis* | Menghitung selisih hari antara tanggal pembelian produk dengan tanggal pengajuan klaim. Klaim ditandai (*Flagged*) jika berada di luar batas garansi retur (30 hari) atau terlalu cepat (< 1 hari). | ✅ Lolos Uji |
| **S2** | *Repeat Claim Analysis* | Memeriksa rekam jejak perilaku ID pembeli pada database historis. Jika pelanggan memiliki frekuensi retur aktif yang tinggi (> 0), sistem mendeteksinya sebagai pola *serial returner*. | ✅ Lolos Uji |
| **S3** | *Visual Inconsistency* | Evaluasi kualitas fisik dokumen gambar oleh Gemini. Menilai apakah foto bukti buram, terlalu gelap, terpotong (*close-up* ekstrem), atau memiliki indikasi manipulasi digital. | ✅ Lolos Uji |
| **S4** | *Text-Visual Mismatch* | *Core reasoning layer*. AI mencocokkan apakah kerusakan teks keluhan singkron dengan visual, serta memvalidasi kesamaan objek fisik antara unggahan pelanggan dengan standar katalog asli pabrik. | ✅ Lolos Uji |

---

## <a id="workflow"></a> 🔄 Alur Kerja Sistem (Workflow)

```text
[Pelanggan Input Resi] ──> Verification Gate ──> [Isi Keluhan & Upload Foto]
                                                           │
                                                           ▼
[Dashboard Admin Portal] <── PAG Engine (Gemini) <── Backend API Processing
```

---

## <a id="tech"></a> 🛠️ Tech Stack

* **Frontend Client:** React.js (Vite), Tailwind CSS, React Router DOM (Manajemen rute `/login`, `/admin`, dan portal klaim depan).
* **Backend Server:** Python 3.13, Flask (RESTful API), Flask-CORS untuk penanganan *Cross-Origin Resource Sharing*.
* **AI Engine:** Google Generative AI SDK (Menggunakan model: `gemini-2.5-flash`).
* **Database:** *In-memory dictionary representation* untuk kebutuhan demo instan yang bebas latensi.

---

## <a id="instalasi"></a> 💻 Panduan Instalasi Lokal

### Prasyarat Sistem
* Node.js (Versi 18 atau terbaru)
* Python (Versi 3.10 hingga 3.13)
* Kunci Akses Resmi API Google AI Studio

### Konfigurasi Komponen Backend
```bash
# Masuk ke folder backend perangkat
cd backend

# Buat lingkungan virtual (Opsional namun disarankan)
python -m venv venv
source venv/bin/activate  # Untuk Windows gunakan: venv\Scripts\activate

# Pasang pustaka dependensi pihak ketiga
pip install -r requirements.txt

# Jalankan server lokal Flask
python app.py
```
Layanan backend akan aktif dan mendengarkan pada alamat: http://127.0.0.1:8080

### Konfigurasi Komponen Frontend
```bash
# Buka tab terminal baru, masuk ke folder frontend
cd frontend

# Pasang modul node yang diperlukan
npm install

# Jalankan server pengembangan lokal (Vite)
npm run dev
```
Akses tautan URL lokal yang tertera pada terminal Vite (Default biasanya: http://localhost:5173)

---

## <a id="env_var"></a> ⚙️ Konfigurasi Environment Variables

Aplikasi memanfaatkan `python-dotenv` pada arsitektur backend untuk mengisolasi kredensial. Buatlah berkas bernama `.env` di dalam direktori root **`backend/`**:

```env
# Inti Kredensial AI Studio (Wajib diisi token asli)
GEMINI_API_KEY=AIzaSy_MASUKKAN_KUNCI_API_ANDA_DISINI

# Konfigurasi Database (Gunakan true untuk mode simulasi presentasi offline)
MOCK_DB=true
```
⚠️ Peringatan Keamanan: Berkas .env telah didaftarkan ke dalam skema .gitignore dan TIDAK BOLEH diunggah ke repositori publik GitHub demi menjaga kuota serta keamanan token API.

---

## <a id="deployment"></a> 🚀 Rencana Penyelesaian & Deployment (Production Ready)

Bagian ini dialokasikan sebagai ruang kerja (*space placeholder*) untuk konfigurasi lingkungan produksi jarak jauh:

### Alamat URL Akses Layanan Resmi
* **Portal Aplikasi (Frontend):** `[ SPACE FOR DEPLOYED FRONTEND URL - TO BE UPDATED ]` (Rencana menggunakan platform Netlify / Vercel).
* **Titik API Utama (Backend):** `[ SPACE FOR DEPLOYED BACKEND RUNTIME URL - TO BE UPDATED ]` (Rencana menggunakan infrastruktur Google Cloud Run).

### Langkah Deployment Google Cloud Run (Target Selanjutnya)
```bash
# [ SPACE PLACEHOLDER: Masukkan rangkaian perintah docker build & gcloud run deploy di sini setelah finalisasi ]
# Contoh draft:
# gcloud builds submit --tag gcr.io/aura-hackathon/backend
# gcloud run deploy backend --image gcr.io/aura-hackathon/backend --platform managed
```

Transisi Basis Data Firestore
Plaintext
[ SPACE PLACEHOLDER ]
Bagian ini disiapkan untuk dokumentasi pemetaan skema koleksi tabel Firebase Firestore 
apabila mode `MOCK_DB` dinonaktifkan (Ubah status variabel ke `false`).

---

## <a id="struktur_repo"></a> 📁 Struktur Repositori

```text
AURA-Hackathon/
├── backend/
│   ├── app.py               # Berkas utama Flask API & Integrasi Gemini SDK
│   ├── requirements.txt     # Daftar pustaka dependencies Python
│   ├── .env                 # Konfigurasi kunci rahasia lokal (Local Only)
│   └── cek_model.py         # Alat bantu verifikasi scopes daftar model API
├── frontend/
│   ├── src/
│   │   ├── components/      # Komponen modular UI (Form, Navbar, dll)
│   │   │   └── IntelligenceReportModal.jsx  # Layar panel analisis AI admin
│   │   ├── App.jsx          # Titik masuk React client & konfigurasi Routes
│   │   └── main.jsx
│   ├── package.json         # Konfigurasi dependensi Node.js
│   └── vite.config.js
└── README.md                # Dokumentasi utama proyek
```

---

## <a id="kontributor"></a> 👥 Kontributor & Pembagian Peran

Proyek pengembangan sistem inteligensi A.U.R.A dikerjakan secara kolaboratif oleh tim Mahasiswa Teknik Komputer, Institut Teknologi Sepuluh Nopember (ITS) Surabaya:

* **Atria Caesariano Tinto:** *AI Engineer & Backend Developer* (Fokus pada riset landasan teori, pemilihan dan perancangan skema arsitektur model, prompt engineering, penanganan error API, serta pengembangan logika RESTful API).
* **Arthur:** *Frontend Engineer* (Fokus pada desain UI/UX, manajemen *State React*, integrasi pengiriman berkas, dan visualisasi diagram *Trust Signals* pada dashboard).

---
*Dibuat dengan dedikasi penuh untuk penyelesaian ekosistem solusi digital berbasis kecerdasan buatan pada pergelaran AURA Hackathon 2026.*

