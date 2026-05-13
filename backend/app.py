import os
import random
import string
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# --- MOCK DATABASE: Simulasi tabel orders ---
MOCK_ORDERS = {
    "TKP-2026-001": {
        "tanggal_beli": "2026-05-01",
        "produk": "Jaket Denim Series B",
        "riwayat_klaim_aktif": 0
    },
    "TKP-FRAUD-99": {
        "tanggal_beli": "2026-03-15",
        "produk": "Kaos Polos Hitam",
        "riwayat_klaim_aktif": 2
    },
    "TKP-2026-002": {
        "tanggal_beli": "2026-05-05",
        "produk": "Sepatu Sneakers Putih",
        "riwayat_klaim_aktif": 0
    },
}

# --- MOCK DATABASE: Simulasi tabel claims yang masuk ---
# Di dunia nyata ini adalah Firestore collection "claims"
SUBMITTED_CLAIMS = []


def generate_claim_id() -> str:
    """Generate ID klaim unik seperti: RET-2026-A3B7"""
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"RET-{datetime.now().year}-{suffix}"


# =============================================================================
# ENDPOINT 1: Verifikasi nomor resi (Gatekeeper Step 1)
# Frontend memanggil ini saat user klik "Verifikasi Pesanan"
# =============================================================================
@app.route('/api/verify_order', methods=['POST'])
def verify_order():
    try:
        data = request.get_json()
        nomor_resi = data.get('nomor_resi', '').strip().upper()

        if not nomor_resi:
            return jsonify({
                "status": "error",
                "data": {},
                "message": "Nomor resi wajib diisi."
            }), 400

        order = MOCK_ORDERS.get(nomor_resi)
        if not order:
            return jsonify({
                "status": "error",
                "data": {},
                "message": f"Nomor resi '{nomor_resi}' tidak ditemukan. Pastikan resi sudah benar."
            }), 404

        return jsonify({
            "status": "success",
            "message": "Pesanan ditemukan. Silakan lanjutkan pengisian klaim.",
            "data": {
                "nomor_resi": nomor_resi,
                "produk": order["produk"],
                "tanggal_beli": order["tanggal_beli"],
            }
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "data": {},
            "message": str(e)
        }), 500


# =============================================================================
# ENDPOINT 2: Submit klaim customer (Claim Form Step 2)
# Frontend memanggil ini saat user klik "Kirim Klaim ke A.U.R.A"
# Backend hanya menerima & menyimpan — analisis AI dilakukan di sisi admin
# =============================================================================
@app.route('/api/submit_claim', methods=['POST'])
def submit_claim():
    try:
        data = request.get_json()

        # --- Validasi input wajib ---
        nomor_resi    = data.get('nomor_resi', '').strip().upper()
        teks_keluhan  = data.get('teks_keluhan', '').strip()
        foto_base64   = data.get('foto_base64')
        video_base64  = data.get('video_base64')          # opsional
        nama_customer = data.get('nama_customer', '').strip()
        email_customer = data.get('email_customer', '').strip()

        if not nomor_resi or not teks_keluhan or not foto_base64:
            return jsonify({
                "status": "error",
                "data": {},
                "message": "Nomor resi, deskripsi keluhan, dan foto bukti wajib diisi."
            }), 400

        # --- Cek resi di database (opsional — jika tidak ada, tetap diterima) ---
        order = MOCK_ORDERS.get(nomor_resi)
        produk_nama = order["produk"] if order else "Produk tidak dikenali"
        is_verified = order is not None

        # --- Simpan ke mock database (nanti diganti Firestore) ---
        claim_id = generate_claim_id()
        new_claim = {
            "claim_id": claim_id,
            "nomor_resi": nomor_resi,
            "produk": produk_nama,
            "nama_customer": nama_customer,
            "email_customer": email_customer,
            "teks_keluhan": teks_keluhan,
            "foto_base64": foto_base64[:50] + "...",  # Potong agar log tidak panjang
            "video_base64": bool(video_base64),        # Simpan flag saja
            "resi_terverifikasi": is_verified,
            "status_klaim": "PENDING_REVIEW",          # Menunggu dianalisis admin
            "submitted_at": datetime.now().isoformat(),
        }
        SUBMITTED_CLAIMS.append(new_claim)

        print(f"[A.U.R.A] Klaim baru masuk: {claim_id} | Resi: {nomor_resi} | Verified: {is_verified} | {nama_customer}")

        return jsonify({
            "status": "success",
            "message": "Klaim berhasil diterima. Tim A.U.R.A akan menganalisis dalam waktu kurang dari 10 menit.",
            "data": {
                "claim_id": claim_id,
                "nomor_resi": nomor_resi,
                "produk": produk_nama,
                "status_klaim": "PENDING_REVIEW",
                "estimasi_selesai": "< 10 menit"
            }
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "data": {},
            "message": str(e)
        }), 500


# =============================================================================
# ENDPOINT 3: Health check
# =============================================================================
@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        "status": "success",
        "data": {
            "version": "1.0.0-mock",
            "mode": "MOCK — Analisis AI dijalankan di sisi admin",
            "total_claims": len(SUBMITTED_CLAIMS)
        },
        "message": "A.U.R.A Customer API is Live!"
    }), 200


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(debug=True, host='0.0.0.0', port=port)