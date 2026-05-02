---
trigger: always_on
---

Buat file `app.py` yang mengimplementasikan sistem backend A.U.R.A (Autonomous Understanding & Return Agent).
Teknologi: Flask, firebase-admin, google-generativeai.

Detail Endpoint:
1. Route: POST /api/analyze_claim
2. Input JSON: `nomor_resi`, `teks_keluhan`, `foto_base64`. Validasi input ini (HTTP 400 jika kosong).
3. Order Lookup: Query ke Firestore koleksi `orders` pakai filter `nomor_resi`. (HTTP 404 jika tidak ada).
4. S1 (Time Gap): Hitung selisih hari dari saat ini ke `tanggal_beli`. Jika < 1 hari atau > 25 hari = 2 poin. Normal = 0.
5. S2 (Repeat Claim): Jika `riwayat_klaim_aktif` > 0 = 3 poin. Normal = 0.
6. Analisis Multimodal: Panggil `gemini-2.0-flash`. System instruction: "Anda adalah A.U.R.A. Kebijakan toko: Cacat minor kompensasi Rp50.000, cacat mayor full refund. Return JSON berisi s3_visual_inconsistency (0-3), s4_text_mismatch (0-2), ai_analysis, dan policy_quote."
7. Agregasi Skor: Total S1+S2+S3+S4. Tentukan kategori: Hijau (0-2), Kuning (3-5), Oranye (6-8), Merah (9-10).
8. Return hasil akhir berupa JSON (HTTP 200).