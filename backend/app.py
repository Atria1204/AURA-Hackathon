import os
import base64
import io
import random
import string
import json
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

import firebase_admin
from firebase_admin import credentials, firestore, storage
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted

import requests
import traceback

# Supabase Integration
try:
    from supabase import create_client, Client as SupabaseClient
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("[A.U.R.A] supabase-py tidak terinstall, skip inisialisasi.")

# Resend Integration
try:
    import resend as resend_sdk
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False
    print("[A.U.R.A] resend tidak terinstall. Jalankan: pip install resend")

# Load Env Variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Max Request Size 16MB
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

# Initialize Firebase & Gemini
MOCK_DB = os.getenv("MOCK_DB", "true").lower() == "true"

db = None
if not MOCK_DB:
    try:
        if not firebase_admin._apps:
            sa_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
            if sa_path and os.path.exists(sa_path):
                cred = credentials.Certificate(sa_path)
                print(f"[A.U.R.A] Menggunakan service account: {sa_path}")
            else:
                cred = credentials.ApplicationDefault()
                print("[A.U.R.A] Menggunakan Application Default Credentials.")
            # Firebase App Initialization
            storage_bucket = os.getenv("FIREBASE_STORAGE_BUCKET", "")
            init_options = {'storageBucket': storage_bucket} if storage_bucket else {}
            firebase_admin.initialize_app(cred, init_options)
        db = firestore.client()
        print("[A.U.R.A] [OK] Firestore berhasil diinisialisasi.")
    except Exception as e:
        traceback.print_exc()
        print(f"[A.U.R.A] [ERROR] Gagal inisialisasi Firebase: {e}")
        MOCK_DB = True

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-2.5-flash')
    print("[A.U.R.A] Gemini AI diinisialisasi.")
else:
    gemini_model = None
    print("[A.U.R.A] Peringatan: GEMINI_API_KEY tidak ditemukan.")

# Supabase Client
supabase_client = None
if SUPABASE_AVAILABLE:
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
    if SUPABASE_URL and SUPABASE_SERVICE_KEY and "your-project" not in SUPABASE_URL:
        try:
            supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
            print("[A.U.R.A] [OK] Supabase Storage client diinisialisasi.")
        except Exception as e:
            print(f"[A.U.R.A] [WARN] Gagal inisialisasi Supabase: {e}")
    else:
        print("[A.U.R.A] Supabase: URL/Key belum dikonfigurasi, skip.")

# Resend Client
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "noreply@yourdomain.com")
if RESEND_AVAILABLE and RESEND_API_KEY and "your_api_key" not in RESEND_API_KEY:
    resend_sdk.api_key = RESEND_API_KEY
    print("[A.U.R.A] [OK] Resend email client diinisialisasi.")
else:
    RESEND_AVAILABLE = False
    print("[A.U.R.A] Resend: API Key belum dikonfigurasi, email dinonaktifkan.")

# Mock Data
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

    "TKP-JKT-002": {
        "tanggal_beli": "2026-05-12",
        "produk": "Waterproof Bomber Jacket Olive",
        "kategori": "Clothing",
        "riwayat_klaim_aktif": 0,
        "foto_katalog_url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=200&auto=format&fit=crop"
    },
    "TKP-JKT-PRO-01": {
        "tanggal_beli": "2026-05-10",
        "produk": "Legacy Denim Jacket - Indigo Blue",
        "kategori": "Clothing",
    },

}

SUBMITTED_CLAIMS = {}

if MOCK_DB:
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


def upload_to_storage(base64_data: str, destination_path: str, content_type: str = "application/octet-stream") -> str:
    """Upload to Firebase Storage."""
    if MOCK_DB or not base64_data:
        return ""
    try:
        if "," in base64_data:
            base64_data = base64_data.split(",", 1)[1]
        file_bytes = base64.b64decode(base64_data)
        bucket = storage.bucket()
        blob = bucket.blob(destination_path)
        blob.upload_from_file(io.BytesIO(file_bytes), content_type=content_type, size=len(file_bytes))
        blob.make_public()
        print(f"[A.U.R.A] [Storage] Upload: {destination_path} -> {blob.public_url}")
        return blob.public_url
    except Exception as e:
        traceback.print_exc()
        print(f"[A.U.R.A] [Storage] Gagal: {e}")
        return ""


# Firestore limit 1MB, so we cap image at 500KB.
MAX_FOTO_BYTES = 500 * 1024


def foto_base64_untuk_firestore(foto_base64: str) -> str:
    """Validates base64 photo size before saving to Firestore."""
    if not foto_base64:
        return ""
    try:
        raw = foto_base64.split(",", 1)[1] if "," in foto_base64 else foto_base64
        size_bytes = len(base64.b64decode(raw))
        size_kb = size_bytes / 1024
        if size_bytes > MAX_FOTO_BYTES:
            print(f"[A.U.R.A] Foto terlalu besar ({size_kb:.1f} KB > {MAX_FOTO_BYTES//1024} KB). Tidak disimpan ke Firestore.")
            return ""   # Terlalu besar
        print(f"[A.U.R.A] Foto OK ({size_kb:.1f} KB), disimpan ke Firestore.")
        return foto_base64
    except Exception:
        return ""


def get_order_data(nomor_resi):
    if MOCK_DB:
        return MOCK_ORDERS.get(nomor_resi)
    else:
        doc = db.collection("orders").document(nomor_resi).get()
        return doc.to_dict() if doc.exists else None

# Endpoint: Verify Order
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
        traceback.print_exc()
        return jsonify({"status": "error", "data": {}, "message": str(e)}), 500


# Endpoint: Submit Claim
@app.route('/api/submit_claim', methods=['POST'])
def submit_claim():
    try:
        data = request.get_json()
        nomor_resi    = data.get('nomor_resi', '').strip().upper()
        teks_keluhan  = data.get('teks_keluhan', '').strip()
        foto_base64   = data.get('foto_base64')
        video_url     = data.get('video_url', '')        # URL dari Supabase Storage (bukan base64)
        email_pelanggan = data.get('email_pelanggan', '').strip()
        
        if not nomor_resi or not teks_keluhan or not foto_base64:
            return jsonify({"status": "error", "data": {}, "message": "Resi, keluhan, dan foto bukti wajib diisi."}), 400

        order = get_order_data(nomor_resi)
        produk_nama = order.get("produk") if order else "Produk tidak dikenali"
        kategori = order.get("kategori", "Misc") if order else "Misc"

        claim_id = generate_claim_id()
        now = datetime.now()

        video_submitted = bool(video_url)
        print(f"[A.U.R.A] Video URL diterima: {video_url[:60] + '...' if video_url and len(video_url) > 60 else video_url or 'tidak ada'}")

        foto_untuk_db = foto_base64_untuk_firestore(foto_base64) if not MOCK_DB else foto_base64

        new_claim = {
            "id": claim_id,
            "resi": nomor_resi,
            "receipt": f"RCPT-{random.randint(100000, 999999)}",
            "product": produk_nama,
            "category": kategori,
            "foto_katalog_url": order.get("foto_katalog_url", ""),
            "date": now.strftime("%b %d, %Y"),
            "time": now.strftime("%I:%M %p"),
            "score": 0,
            "image": foto_untuk_db,
            "foto_base64": foto_base64,
            "video_submitted": video_submitted,
            "video_url": video_url,
            "teks_keluhan": teks_keluhan,
            "status_klaim": "PENDING_REVIEW",
            "ai_analysis": "",
            "policy_quote": "",
            "signals": {"S1": "Pending", "S2": "Pending", "S3": "Pending", "S4": "Pending"},
            "reject_reason": "",
            "email": email_pelanggan,
            "created_at": now.isoformat()
        }

        if MOCK_DB:
            SUBMITTED_CLAIMS[claim_id] = new_claim
        else:
            firestore_doc = {k: v for k, v in new_claim.items() if k != "foto_base64"}
            db.collection("claims").document(claim_id).set(firestore_doc)
            print(f"[A.U.R.A] Klaim {claim_id} -> Firestore OK. Video URL: {video_url[:40] if video_url else 'tidak ada'}")

        return jsonify({
            "status": "success",
            "data": {
                "claim_id": claim_id,
                "status_klaim": "PENDING_REVIEW",
                "video_submitted": video_submitted,
                "video_url": video_url,
            },
            "message": "Klaim berhasil diterima."
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "data": {}, "message": str(e)}), 500


# Endpoint: Get All Claims
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
        traceback.print_exc()
        return jsonify({"status": "error", "data": {}, "message": str(e)}), 500


# Endpoint: Analyze Claim (Gemini AI)
@app.route('/api/analyze_claim', methods=['POST'])
def analyze_claim():
    try:
        data = request.get_json()
        claim_id = data.get("claim_id")
        foto_base64_input = data.get("foto_base64", "")
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
            Tugas Anda memvalidasi klaim dengan membandingkan teks dan DUA GAMBAR berikut.
            
            Klaim Produk: {order.get('produk', 'Tidak diketahui')}
            Keluhan customer: "{claim_data.get('teks_keluhan')}"
            
            Instruksi Wajib:
            1. Bandingkan "Foto Katalog Asli" dengan "Foto Bukti Pelanggan".
            2. Jika benda di foto pelanggan BEDA BARANG dengan katalog, S4 = 2.
            3. Jika kerusakan tidak terlihat sama sekali di foto, S4 = 2.
            4. Tulis analisis SINGKAT, PADAT, MAKSIMAL 3-4 KALIMAT. JANGAN bertele-tele.
            
            Format Output JSON Wajib:
            {{
              "s3_visual_inconsistency": 0,
              "s4_text_mismatch": 0,
              "ai_analysis": "...",
              "policy_quote": "..."
            }}
            """
            
            gemini_inputs = [prompt]
            katalog_loaded = False
            pelanggan_loaded = False

            katalog_url = order.get("foto_katalog_url", "")
            print(f"[A.U.R.A][Gemini] Katalog URL: {katalog_url or 'KOSONG'}")
            if katalog_url:
                try:
                    resp = requests.get(katalog_url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
                    print(f"[A.U.R.A][Gemini] Katalog HTTP status: {resp.status_code}, size: {len(resp.content)} bytes")
                    if resp.status_code == 200 and len(resp.content) > 0:
                        content_type = resp.headers.get('Content-Type', 'image/jpeg').split(';')[0].strip()
                        gemini_inputs.append("Ini Foto Katalog Asli produk yang seharusnya diterima pelanggan:")
                        gemini_inputs.append({"mime_type": content_type, "data": resp.content})
                        katalog_loaded = True
                        print(f"[A.U.R.A][Gemini] [OK] Foto katalog berhasil dimuat ({content_type})")
                    else:
                        print(f"[A.U.R.A][Gemini] [FAIL] Foto katalog gagal: HTTP {resp.status_code}")
                except Exception as e:
                    print(f"[A.U.R.A][Gemini] [ERROR] Gagal download katalog: {e}")
            else:
                print("[A.U.R.A][Gemini] [WARN] Tidak ada foto_katalog_url di order data.")

            foto_b64 = foto_base64_input or claim_data.get("foto_base64", "") or claim_data.get("image", "")
            print(f"[A.U.R.A][Gemini] Foto pelanggan tersedia: {'YA' if foto_b64 else 'TIDAK'} (len={len(foto_b64) if foto_b64 else 0})")
            if foto_b64 and "," in foto_b64:
                try:
                    header, encoded = foto_b64.split(",", 1)
                    mime_type = header.split(";")[0].split(":")[1]
                    img_bytes = base64.b64decode(encoded)
                    gemini_inputs.append("Ini Foto Bukti dari Pelanggan yang mengajukan klaim:")
                    gemini_inputs.append({"mime_type": mime_type, "data": img_bytes})
                    pelanggan_loaded = True
                    print(f"[A.U.R.A][Gemini] [OK] Foto pelanggan berhasil dimuat ({mime_type}, {len(img_bytes)} bytes)")
                except Exception as e:
                    print(f"[A.U.R.A][Gemini] [ERROR] Gagal decode foto pelanggan: {e}")
            else:
                print("[A.U.R.A][Gemini] [WARN] Foto pelanggan tidak tersedia atau format tidak valid.")

            print(f"[A.U.R.A][Gemini] Ringkasan input: katalog={'OK' if katalog_loaded else 'MISSING'}, pelanggan={'OK' if pelanggan_loaded else 'MISSING'}, total_parts={len(gemini_inputs)}")

            response = gemini_model.generate_content(gemini_inputs)
            
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
        traceback.print_exc()
        return jsonify({"status": "error", "data": {}, "message": str(e)}), 500


# Endpoint: Update Claim Status
@app.route('/api/update_claim_status', methods=['POST'])
def update_claim_status():
    try:
        data = request.get_json()
        claim_id      = data.get("claim_id")
        status_klaim  = data.get("status_klaim")   # APPROVED atau REJECTED
        reason        = data.get("reject_reason", "")
        resolved_by   = data.get("resolved_by", "Admin")  # opsional: nama/email admin

        if not claim_id or not status_klaim:
            return jsonify({"status": "error", "data": {}, "message": "claim_id dan status_klaim wajib diisi."}), 400

        valid_statuses = {"APPROVED", "REJECTED"}
        if status_klaim not in valid_statuses:
            return jsonify({"status": "error", "data": {}, "message": f"status_klaim harus salah satu dari: {valid_statuses}"}), 400

        now_iso = datetime.now().isoformat()

        updates = {
            "status_klaim": status_klaim,
            "reject_reason": reason,
            "resolved_at": now_iso,
            "resolved_by": resolved_by,
        }

        if MOCK_DB:
            if claim_id in SUBMITTED_CLAIMS:
                SUBMITTED_CLAIMS[claim_id].update(updates)
            else:
                return jsonify({"status": "error", "data": {}, "message": "Klaim tidak ditemukan."}), 404
        else:
            doc_ref = db.collection("claims").document(claim_id)
            doc = doc_ref.get()
            if not doc.exists:
                return jsonify({"status": "error", "data": {}, "message": "Klaim tidak ditemukan."}), 404
            doc_ref.update(updates)
            print(f"[A.U.R.A] Klaim {claim_id} disimpan ke Firestore dengan status {status_klaim} pada {now_iso}")

        return jsonify({
            "status": "success",
            "data": {
                "claim_id": claim_id,
                "status_klaim": status_klaim,
                "resolved_at": now_iso,
                "resolved_by": resolved_by,
            },
            "message": f"Status klaim berhasil diperbarui menjadi {status_klaim}."
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "data": {}, "message": str(e)}), 500


# Endpoint: Get Resolved Claims
@app.route('/api/claims/resolved', methods=['GET'])
def get_resolved_claims():
    """Mengembalikan semua klaim yang sudah di-APPROVED atau REJECTED.
    Query param opsional:
      - status : 'APPROVED' | 'REJECTED'  (filter salah satu)
      - limit  : integer (default 100)
    """
    try:
        filter_status = request.args.get("status", "").upper()   # '' = semua
        limit         = int(request.args.get("limit", 100))

        resolved = []
        if MOCK_DB:
            for c in SUBMITTED_CLAIMS.values():
                s = c.get("status_klaim", "")
                if s in {"APPROVED", "REJECTED"}:
                    if not filter_status or s == filter_status:
                        resolved.append(c)
            # Urutkan berdasarkan resolved_at descending
            resolved.sort(key=lambda x: x.get("resolved_at", ""), reverse=True)
            resolved = resolved[:limit]
        else:
            query = db.collection("claims")
            if filter_status in {"APPROVED", "REJECTED"}:
                query = query.where("status_klaim", "==", filter_status)
            else:
                # Ambil APPROVED dan REJECTED sekaligus tidak bisa dengan OR di SDK lama,
                # jadi kita ambil semua lalu filter di memori.
                all_docs = query.order_by("resolved_at", direction=firestore.Query.DESCENDING).limit(limit).get()
                resolved = [
                    d.to_dict() for d in all_docs
                    if d.to_dict().get("status_klaim") in {"APPROVED", "REJECTED"}
                ]
                return jsonify({
                    "status": "success",
                    "data": resolved,
                    "message": f"{len(resolved)} klaim sudah diputuskan."
                }), 200

            docs = query.order_by("resolved_at", direction=firestore.Query.DESCENDING).limit(limit).get()
            resolved = [d.to_dict() for d in docs]

        return jsonify({
            "status": "success",
            "data": resolved,
            "message": f"{len(resolved)} klaim sudah diputuskan."
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "data": {}, "message": str(e)}), 500


# Endpoint: Claim Stats
@app.route('/api/claims/stats', methods=['GET'])
def get_claims_stats():
    """Mengembalikan jumlah klaim per status untuk ditampilkan di dashboard."""
    try:
        stats = {"PENDING_REVIEW": 0, "APPROVED": 0, "REJECTED": 0, "total": 0}

        if MOCK_DB:
            for c in SUBMITTED_CLAIMS.values():
                s = c.get("status_klaim", "PENDING_REVIEW")
                if s in stats:
                    stats[s] += 1
                stats["total"] += 1
        else:
            docs = db.collection("claims").get()
            for d in docs:
                s = d.to_dict().get("status_klaim", "PENDING_REVIEW")
                if s in stats:
                    stats[s] += 1
                stats["total"] += 1

        return jsonify({
            "status": "success",
            "data": stats,
            "message": "Statistik klaim berhasil diambil."
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "data": {}, "message": str(e)}), 500


# Endpoint: Health Check
@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        "status": "success",
        "data": {
            "version": "1.1.0",
            "mode": "MOCK" if MOCK_DB else "FIRESTORE",
            "ai_ready": gemini_model is not None
        },
        "message": "A.U.R.A API is Live!"
    }), 200

# Endpoint: Available Models
@app.route('/api/models', methods=['GET'])
def list_available_models():
    try:
        if not gemini_model:
            return jsonify({"error": "Gemini belum diinisialisasi. Cek API Key."}), 500
            
        models = genai.list_models()
        available_models = [m.name for m in models if 'generateContent' in m.supported_generation_methods]
        
        return jsonify({
            "status": "success",
            "supported_models": available_models
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Helper: Send Resend Email
def send_email_konfirmasi(to_email: str, claim_id: str, status: str, produk: str, reason: str = "") -> bool:
    """
    Kirim email konfirmasi ke pelanggan via Resend.
    status: 'SUBMITTED' | 'APPROVED' | 'REJECTED'
    Mengembalikan True jika berhasil, False jika gagal.
    """
    if not RESEND_AVAILABLE:
        print("[A.U.R.A] Resend tidak aktif, email tidak dikirim.")
        return False

    status_labels = {
        "SUBMITTED": ("📬 Klaim Diterima", "#0ea5e9"),
        "APPROVED":  ("✅ Klaim Disetujui", "#22c55e"),
        "REJECTED":  ("❌ Klaim Ditolak",  "#ef4444"),
    }
    label, color = status_labels.get(status, ("📋 Update Klaim", "#64748b"))

    reason_html = f"""
        <p style="margin:8px 0;color:#64748b;font-size:14px;">
            <strong>Alasan:</strong> {reason}
        </p>""" if reason and status == "REJECTED" else ""

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; background:#f8fafc; margin:0; padding:32px;">
      <div style="max-width:560px; margin:auto; background:#fff; border-radius:16px;
                  box-shadow:0 4px 24px rgba(0,0,0,0.08); overflow:hidden;">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,#0f172a,#1e3a5f); padding:32px; text-align:center;">
          <h1 style="color:#fff; margin:0; font-size:22px; letter-spacing:2px;">A.U.R.A</h1>
          <p style="color:#94a3b8; margin:4px 0 0; font-size:12px;">Autonomous Understanding &amp; Return Agent</p>
        </div>

        <!-- Body -->
        <div style="padding:32px;">
          <div style="background:{color}1a; border-left:4px solid {color};
                      border-radius:8px; padding:16px; margin-bottom:24px;">
            <p style="margin:0; font-size:18px; font-weight:700; color:{color};">{label}</p>
          </div>

          <p style="color:#334155; font-size:15px;">Halo, berikut update terbaru untuk klaim Anda:</p>

          <table style="width:100%; border-collapse:collapse; margin:16px 0;">
            <tr style="border-bottom:1px solid #e2e8f0;">
              <td style="padding:10px 4px; color:#64748b; font-size:13px;">ID Klaim</td>
              <td style="padding:10px 4px; font-weight:700; color:#0f172a;">{claim_id}</td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0;">
              <td style="padding:10px 4px; color:#64748b; font-size:13px;">Produk</td>
              <td style="padding:10px 4px; color:#0f172a;">{produk}</td>
            </tr>
            <tr>
              <td style="padding:10px 4px; color:#64748b; font-size:13px;">Status</td>
              <td style="padding:10px 4px; font-weight:700; color:{color};">{status}</td>
            </tr>
          </table>

          {reason_html}

          <p style="color:#94a3b8; font-size:12px; margin-top:32px; text-align:center;">
            Email ini dikirim otomatis oleh sistem A.U.R.A. Jangan membalas email ini.
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#f1f5f9; padding:16px; text-align:center;">
          <p style="color:#94a3b8; font-size:11px; margin:0;">&copy; 2026 A.U.R.A System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    """

    try:
        resp = resend_sdk.Emails.send({
            "from": RESEND_FROM_EMAIL,
            "to": [to_email],
            "subject": f"[A.U.R.A] {label} — {claim_id}",
            "html": html_body,
        })
        print(f"[A.U.R.A] Email terkirim ke {to_email} | ID: {resp.get('id', '-')}")
        return True
    except Exception as e:
        print(f"[A.U.R.A] Gagal kirim email: {e}")
        return False


# =============================================================================
# ENDPOINT 9: Kirim Email Konfirmasi (dipanggil setelah submit/update status)
# =============================================================================
@app.route('/api/send_confirmation', methods=['POST'])
def send_confirmation():
    """
    Kirim email konfirmasi ke pelanggan.
    Input JSON:
      - to_email   : string (alamat email penerima)
      - claim_id   : string
      - status     : 'SUBMITTED' | 'APPROVED' | 'REJECTED'
      - produk     : string (nama produk)
      - reason     : string (opsional, alasan penolakan)
    """
    try:
        data = request.get_json()
        to_email  = data.get("to_email", "").strip()
        claim_id  = data.get("claim_id", "").strip()
        status    = data.get("status", "").strip().upper()
        produk    = data.get("produk", "Produk tidak diketahui").strip()
        reason    = data.get("reason", "").strip()

        # Validasi input
        if not to_email or not claim_id or not status:
            return jsonify({
                "status": "error",
                "data": {},
                "message": "to_email, claim_id, dan status wajib diisi."
            }), 400

        valid_statuses = {"SUBMITTED", "APPROVED", "REJECTED"}
        if status not in valid_statuses:
            return jsonify({
                "status": "error",
                "data": {},
                "message": f"status harus salah satu dari: {valid_statuses}"
            }), 400

        ok = send_email_konfirmasi(to_email, claim_id, status, produk, reason)

        if ok:
            return jsonify({
                "status": "success",
                "data": {"to": to_email, "claim_id": claim_id, "status": status},
                "message": "Email konfirmasi berhasil dikirim."
            }), 200
        else:
            return jsonify({
                "status": "error",
                "data": {},
                "message": "Gagal mengirim email. Periksa RESEND_API_KEY dan RESEND_FROM_EMAIL di .env."
            }), 500

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "data": {}, "message": str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(debug=True, host='0.0.0.0', port=port)