import os
import random
import string
import json
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

import firebase_admin
from firebase_admin import credentials, firestore
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted

# Muat variabel environment
load_dotenv()

app = Flask(__name__)
CORS(app)

# Batasi ukuran request (contoh 16MB)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

# =============================================================================
# INISIALISASI FIREBASE & GEMINI (Di luar endpoint / mencegah cold start)
# =============================================================================
MOCK_DB = os.getenv("MOCK_DB", "true").lower() == "true"

db = None
if not MOCK_DB:
    try:
        if not firebase_admin._apps:
            # Menggunakan kredensial dari GOOGLE_APPLICATION_CREDENTIALS env var
            cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("[A.U.R.A] Firestore diinisialisasi.")
    except Exception as e:
        print(f"[A.U.R.A] Gagal inisialisasi Firestore: {e}")
        MOCK_DB = True

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-2.0-flash')
    print("[A.U.R.A] Gemini AI diinisialisasi.")
else:
    gemini_model = None
    print("[A.U.R.A] Peringatan: GEMINI_API_KEY tidak ditemukan.")

# =============================================================================
# MOCK DATA (Fallback jika MOCK_DB=true)
# =============================================================================
MOCK_ORDERS = {
    "TKP-2026-001": {
        "tanggal_beli": "2026-05-01",
        "produk": "Pro Audio ANC Headphones",
        "kategori": "Electronics",
        "riwayat_klaim_aktif": 0,
        "foto_katalog_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200&auto=format&fit=crop"
    },
    "TKP-FRAUD-99": {
        "tanggal_beli": "2026-03-15",
        "produk": "Kaos Polos Hitam",
        "kategori": "Clothing",
        "riwayat_klaim_aktif": 2,
        "foto_katalog_url": ""
    },
    "TKP-2026-002": {
        "tanggal_beli": "2026-05-05",
        "produk": "AeroRun Elite Sneakers",
        "kategori": "Footwear",
        "riwayat_klaim_aktif": 0,
        "foto_katalog_url": ""
    },
}

SUBMITTED_CLAIMS = {}

# Inisialisasi dummy claims jika mock DB
if MOCK_DB:
    # Memasukkan dummy claims agar Admin Dashboard tidak kosong
    dummy_claims = [
      { "id": "CLM-9921", "resi": "TKP-2026-001", "receipt": "RCPT-445102", "product": "Pro Audio ANC Headphones", "category": "Electronics", "date": "Oct 24, 2023", "time": "10:42 AM", "score": 96, "image": 'https://lh3.googleusercontent.com/aida-public/AB6AXuCb8q4jqUsa_lDSQUkuCDJlzouO1I5MC08C3C14vYtU9sput3hg-YAva44R0CCQgYYXsHUtXIoaI69g_lPsGRsmIaGaUFEyeY5F5sV3wkjgcfb3ByCeakX1BbDRsSGfYox4gyrhmt7tD8CslZTTX5_NSwEazpoqONjIegtDqDXO_5ZFkAvnZkqBlJlNY-xYKqJ85jWqHlBimYbqGJGmKgL88bfvqxq8IXaorAgGDwZlKE9pbgfO7X47bYmplqgzjLtsXMDEXHHjA3TT', "status_klaim": "PENDING_REVIEW", "teks_keluhan": "Baret di samping", "signals": {"S1": "Pass", "S2": "Pass", "S3": "Pass", "S4": "Pass"} },
      { "id": "CLM-9920", "resi": "TKP-2026-002", "receipt": "RCPT-445088", "product": "AeroRun Elite Sneakers", "category": "Footwear", "date": "Oct 24, 2023", "time": "09:15 AM", "score": 65, "image": 'https://lh3.googleusercontent.com/aida-public/AB6AXuA91gOX-A3MJE4hDAfX6fNyPTYG21d7ZoVSJhh8WyrsFFq31e8saVVnErAEBHZTj7b3WGt_EC4wpaOeCPnuQ6h9G-eru98KM1HInfAwxKDuNANFQTwZ43L99SsGCQ0UGcID1SKtgU4H7oAYvnqAeINiel_K25smmITU9al8d2rsvsU35y_yaMvDuKUwbkCVoPY4EWkDprxCrsOS2kHTK3v3g3TY2URUDMQS4k8-SJLrgdC4Hj8cpnrWYpgdQbnjmXZjaW_ST925EYdJ', "status_klaim": "PENDING_REVIEW", "teks_keluhan": "Lem lepas", "signals": {"S1": "Pass", "S2": "Pass", "S3": "Flagged", "S4": "Pass"} }
    ]
    for c in dummy_claims:
        SUBMITTED_CLAIMS[c["id"]] = c

def generate_claim_id() -> str:
    """Generate ID klaim unik seperti: CLM-A3B7"""
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"CLM-{suffix}"

def get_order_data(nomor_resi):
    if MOCK_DB:
        return MOCK_ORDERS.get(nomor_resi)
    else:
        doc = db.collection("orders").document(nomor_resi).get()
        return doc.to_dict() if doc.exists else None

# =============================================================================
# ENDPOINT 1: Verifikasi nomor resi (Gatekeeper)
# =============================================================================
@app.route('/api/verify_order', methods=['POST'])
def verify_order():
    try:
        data = request.get_json()
        nomor_resi = data.get('nomor_resi', '').strip().upper()

        if not nomor_resi:
            return jsonify({"status": "error", "data": {}, "message": "Nomor resi wajib diisi."}), 400

        order = get_order_data(nomor_resi)
        if not order:
            return jsonify({"status": "error", "data": {}, "message": f"Nomor resi '{nomor_resi}' tidak ditemukan."}), 404

        return jsonify({
            "status": "success",
            "data": {
                "nomor_resi": nomor_resi,
                "produk": order.get("produk"),
                "tanggal_beli": order.get("tanggal_beli"),
                "kategori": order.get("kategori", "Uncategorized"),
                "foto_katalog_url": order.get("foto_katalog_url", "")
            },
            "message": "Pesanan ditemukan."
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "data": {}, "message": str(e)}), 500


# =============================================================================
# ENDPOINT 2: Submit Klaim
# =============================================================================
@app.route('/api/submit_claim', methods=['POST'])
def submit_claim():
    try:
        data = request.get_json()
        nomor_resi    = data.get('nomor_resi', '').strip().upper()
        teks_keluhan  = data.get('teks_keluhan', '').strip()
        foto_base64   = data.get('foto_base64')
        video_base64  = data.get('video_base64')
        
        if not nomor_resi or not teks_keluhan or not foto_base64:
            return jsonify({"status": "error", "data": {}, "message": "Resi, keluhan, dan foto bukti wajib diisi."}), 400

        order = get_order_data(nomor_resi)
        produk_nama = order.get("produk") if order else "Produk tidak dikenali"
        kategori = order.get("kategori", "Misc") if order else "Misc"

        claim_id = generate_claim_id()
        now = datetime.now()
        
        new_claim = {
            "id": claim_id,
            "resi": nomor_resi,
            "receipt": f"RCPT-{random.randint(100000, 999999)}",
            "product": produk_nama,
            "category": kategori,
            "date": now.strftime("%b %d, %Y"),
            "time": now.strftime("%I:%M %p"),
            "score": 0, # AI belum analyze
            "image": foto_base64[:100] + "..." if MOCK_DB else foto_base64, # Jangan simpan base64 besar di mock
            "foto_base64": foto_base64, # untuk processing
            "video": video_base64[:100] + "..." if (MOCK_DB and video_base64) else video_base64,
            "video_base64": video_base64,
            "teks_keluhan": teks_keluhan,
            "status_klaim": "PENDING_REVIEW",
            "ai_analysis": "",
            "policy_quote": "",
            "signals": {"S1": "Pending", "S2": "Pending", "S3": "Pending", "S4": "Pending"},
            "reject_reason": "",
            "created_at": now.isoformat()
        }

        if MOCK_DB:
            SUBMITTED_CLAIMS[claim_id] = new_claim
        else:
            db.collection("claims").document(claim_id).set(new_claim)

        return jsonify({
            "status": "success",
            "data": {"claim_id": claim_id, "status_klaim": "PENDING_REVIEW"},
            "message": "Klaim berhasil diterima."
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "data": {}, "message": str(e)}), 500


# =============================================================================
# ENDPOINT 3: Dapatkan Semua Klaim untuk Admin Dashboard
# =============================================================================
@app.route('/api/claims', methods=['GET'])
def get_claims():
    try:
        claims_list = []
        if MOCK_DB:
            claims_list = list(SUBMITTED_CLAIMS.values())
        else:
            docs = db.collection("claims").order_by("created_at", direction=firestore.Query.DESCENDING).get()
            claims_list = [doc.to_dict() for doc in docs]
            
        # Hide full base64 in list view
        for c in claims_list:
            if c.get("foto_base64") and len(c.get("foto_base64")) > 200:
                c["image_preview"] = True # indicator
            
        return jsonify({
            "status": "success",
            "data": claims_list,
            "message": "Data klaim berhasil diambil."
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "data": {}, "message": str(e)}), 500


# =============================================================================
# ENDPOINT 4: Analisis Klaim (Gemini + Scoring)
# =============================================================================
@app.route('/api/analyze_claim', methods=['POST'])
def analyze_claim():
    try:
        data = request.get_json()
        claim_id = data.get("claim_id")
        if not claim_id:
            return jsonify({"status": "error", "data": {}, "message": "claim_id wajib diisi."}), 400

        # Ambil klaim
        claim_data = None
        if MOCK_DB:
            claim_data = SUBMITTED_CLAIMS.get(claim_id)
        else:
            doc_ref = db.collection("claims").document(claim_id)
            doc = doc_ref.get()
            if doc.exists:
                claim_data = doc.to_dict()
                
        if not claim_data:
            return jsonify({"status": "error", "data": {}, "message": "Klaim tidak ditemukan."}), 404
            
        nomor_resi = claim_data.get("resi")
        order = get_order_data(nomor_resi) or {}
        
        # --- S1 (Time Gap) ---
        s1_score = 0
        try:
            tgl_beli = datetime.strptime(order.get("tanggal_beli", "2020-01-01"), "%Y-%m-%d")
            selisih_hari = (datetime.now() - tgl_beli).days
            if selisih_hari < 1 or selisih_hari > 25:
                s1_score = 2
        except:
            s1_score = 2
            
        # --- S2 (Repeat Claim) ---
        s2_score = 3 if order.get("riwayat_klaim_aktif", 0) > 0 else 0
        
        # --- Analisis AI (S3 & S4) ---
        s3_score = 0
        s4_score = 0
        ai_analysis = "Analisis AI tidak tersedia (Mock mode atau API Key tidak ada)."
        policy_quote = "Kebijakan standar A.U.R.A berlaku."
        
        if gemini_model:
            prompt = f"""
            Anda adalah A.U.R.A (Autonomous Understanding & Return Agent).
            Kebijakan toko: Cacat minor kompensasi Rp50.000, cacat mayor full refund.
            Keluhan customer: "{claim_data.get('teks_keluhan')}"
            
            Berikan respons dalam format JSON valid dengan field:
            - s3_visual_inconsistency (0-3): Nilai inkonsistensi visual (0=konsisten/aman, 3=sangat mencurigakan).
            - s4_text_mismatch (0-2): Nilai mismatch teks dan gambar (0=sesuai, 2=tidak sesuai).
            - ai_analysis (string): Penjelasan analisis singkat.
            - policy_quote (string): Kutipan kebijakan toko yang relevan.
            """
            # Jika ada integrasi foto, kirimkan part image. Di sini kita bypass parsing bas64 jika terlalu panjang/error
            # Sebagai contoh kita kirim teks saja jika handling base64 kompleks, tapi bisa disesuaikan.
            
            response = gemini_model.generate_content(prompt)
            # Parsing JSON dari response
            resp_text = response.text
            # Ekstrak JSON jika dibungkus markdown
            if "```json" in resp_text:
                resp_text = resp_text.split("```json")[1].split("```")[0].strip()
            elif "```" in resp_text:
                resp_text = resp_text.split("```")[1].split("```")[0].strip()
                
            try:
                ai_data = json.loads(resp_text)
                s3_score = ai_data.get("s3_visual_inconsistency", 0)
                s4_score = ai_data.get("s4_text_mismatch", 0)
                ai_analysis = ai_data.get("ai_analysis", "")
                policy_quote = ai_data.get("policy_quote", "")
            except:
                ai_analysis = "Gagal mem-parsing hasil analisis AI."
                
        # --- Agregasi Skor ---
        total_risk = s1_score + s2_score + s3_score + s4_score # Max 10
        # Convert total risk (0-10) to Trust Score (100 - 0)
        trust_score = 100 - (total_risk * 10)
        trust_score = max(0, min(100, trust_score))
        
        # Update data
        updates = {
            "score": trust_score,
            "ai_analysis": ai_analysis,
            "policy_quote": policy_quote,
            "signals": {
                "S1": "Flagged" if s1_score > 0 else "Pass",
                "S2": "Flagged" if s2_score > 0 else "Pass",
                "S3": "Flagged" if s3_score > 0 else "Pass",
                "S4": "Flagged" if s4_score > 0 else "Pass"
            }
        }
        claim_data.update(updates)
        
        if MOCK_DB:
            SUBMITTED_CLAIMS[claim_id] = claim_data
        else:
            db.collection("claims").document(claim_id).update(updates)
            
        return jsonify({
            "status": "success",
            "data": claim_data,
            "message": "Analisis selesai."
        }), 200

    except ResourceExhausted:
        return jsonify({
            "status": "error",
            "data": {},
            "message": "Rate limit tercapai. Silakan coba beberapa saat lagi."
        }), 429
    except Exception as e:
        return jsonify({"status": "error", "data": {}, "message": str(e)}), 500


# =============================================================================
# ENDPOINT 5: Update Status Klaim (Approve / Reject)
# =============================================================================
@app.route('/api/update_claim_status', methods=['POST'])
def update_claim_status():
    try:
        data = request.get_json()
        claim_id = data.get("claim_id")
        status_klaim = data.get("status_klaim") # APPROVED atau REJECTED
        reason = data.get("reject_reason", "")
        
        if not claim_id or not status_klaim:
            return jsonify({"status": "error", "data": {}, "message": "claim_id dan status_klaim wajib diisi."}), 400
            
        updates = {
            "status_klaim": status_klaim,
            "reject_reason": reason
        }

        if MOCK_DB:
            if claim_id in SUBMITTED_CLAIMS:
                SUBMITTED_CLAIMS[claim_id].update(updates)
            else:
                return jsonify({"status": "error", "data": {}, "message": "Klaim tidak ditemukan."}), 404
        else:
            doc_ref = db.collection("claims").document(claim_id)
            if not doc_ref.get().exists:
                return jsonify({"status": "error", "data": {}, "message": "Klaim tidak ditemukan."}), 404
            doc_ref.update(updates)
            
        return jsonify({
            "status": "success",
            "data": {"claim_id": claim_id, "status_klaim": status_klaim},
            "message": f"Status klaim diperbarui menjadi {status_klaim}."
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "data": {}, "message": str(e)}), 500


# =============================================================================
# ENDPOINT 6: Health Check
# =============================================================================
@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        "status": "success",
        "data": {
            "version": "1.0.0",
            "mode": "MOCK" if MOCK_DB else "FIRESTORE",
            "ai_ready": gemini_model is not None
        },
        "message": "A.U.R.A API is Live!"
    }), 200


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(debug=True, host='0.0.0.0', port=port)