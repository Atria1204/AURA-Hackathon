---
trigger: always_on
---

* Gunakan framework Flask untuk semua pembuatan API.
* Pisahkan inisialisasi Firebase dan Gemini API di luar function endpoint untuk mencegah overhead (Cold Start).
* Selalu gunakan `python-dotenv` untuk membaca API Key dari file `.env`. Jangan pernah hardcode credentials.
* Semua endpoint harus mengembalikan response JSON dengan struktur baku: {"status": "success"|"error", "data": {...}, "message": "..."}.
* Setiap endpoint yang memanggil model generatif (Google Generative AI) WAJIB dibungkus dengan `try...except` yang menangani error `ResourceExhausted` secara spesifik, dan kembalikan HTTP Status 429.
* Abaikan pembuatan UI/HTML. Fokus pada backend REST API.