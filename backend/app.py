import os
import json
import base64
from datetime import datetime
from flask import Flask, request, jsonify
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore
import google.generativeai as genai
from google.api_core import exceptions
from flask_cors import CORS

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize Firebase
firebase_key_path = os.getenv("FIREBASE_KEY_PATH", "firebase-key.json")
try:
    cred = credentials.Certificate(firebase_key_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
except Exception as e:
    print(f"Error initializing Firebase: {e}")
    db = None

# Initialize Gemini
gemini_api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=gemini_api_key)
model = genai.GenerativeModel('gemini-2.0-flash')

SYSTEM_INSTRUCTION = """
Anda adalah A.U.R.A (Autonomous Understanding & Return Agent). 
Kebijakan toko: Cacat minor kompensasi Rp50.000, cacat mayor full refund. 

Tugas Anda adalah menganalisis klaim pengembalian barang berdasarkan foto dan teks keluhan.
Berikan penilaian dalam format JSON:
{
  "s3_visual_inconsistency": 0-3,
  "s4_text_mismatch": 0-2,
  "ai_analysis": "string penjelasan",
  "policy_quote": "string kutipan kebijakan yang relevan"
}
"""

def calculate_s1(tanggal_beli):
    """
    S1 (Time Gap): Hitung selisih hari dari saat ini ke tanggal_beli. 
    Jika < 1 hari atau > 25 hari = 2 poin. Normal = 0.
    """
    if not tanggal_beli:
        return 0
    
    # Ensure tanggal_beli is a datetime object (Firestore returns it as such)
    if isinstance(tanggal_beli, datetime):
        buy_date = tanggal_beli
    else:
        # Fallback if it's a string
        try:
            buy_date = datetime.fromisoformat(str(tanggal_beli))
        except:
            return 0
            
    now = datetime.now(buy_date.tzinfo) if buy_date.tzinfo else datetime.now()
    diff = (now - buy_date).days
    
    if diff < 1 or diff > 25:
        return 2
    return 0

def calculate_s2(riwayat_klaim_aktif):
    """
    S2 (Repeat Claim): Jika riwayat_klaim_aktif > 0 = 3 poin. Normal = 0.
    """
    if riwayat_klaim_aktif and int(riwayat_klaim_aktif) > 0:
        return 3
    return 0

def get_risk_category(total_score):
    if total_score <= 2:
        return "Hijau"
    elif total_score <= 5:
        return "Kuning"
    elif total_score <= 8:
        return "Oranye"
    else:
        return "Merah"

@app.route('/api/analyze_claim', methods=['POST'])
def analyze_claim():
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                "status": "error",
                "message": "Invalid JSON input",
                "data": None
            }), 400

        nomor_resi = data.get('nomor_resi')
        teks_keluhan = data.get('teks_keluhan')
        foto_base64 = data.get('foto_base64')

        # Validation
        if not all([nomor_resi, teks_keluhan, foto_base64]):
            return jsonify({
                "status": "error",
                "message": "Missing required fields: nomor_resi, teks_keluhan, or foto_base64",
                "data": None
            }), 400

        # Order Lookup in Firestore
        if db is None:
             return jsonify({
                "status": "error",
                "message": "Database connection error",
                "data": None
            }), 500

        order_ref = db.collection('orders').where('nomor_resi', '==', nomor_resi).limit(1).get()
        if not order_ref:
            return jsonify({
                "status": "error",
                "message": f"Order with nomor_resi {nomor_resi} not found",
                "data": None
            }), 404

        order_data = order_ref[0].to_dict()
        tanggal_beli = order_data.get('tanggal_beli')
        riwayat_klaim_aktif = order_data.get('riwayat_klaim_aktif', 0)

        # S1 & S2 Scoring
        s1 = calculate_s1(tanggal_beli)
        s2 = calculate_s2(riwayat_klaim_aktif)

        # Gemini Multimodal Analysis
        try:
            image_part = {
                'mime_type': 'image/jpeg',
                'data': foto_base64
            }
            
            prompt = f"Teks Keluhan: {teks_keluhan}\n\n{SYSTEM_INSTRUCTION}"
            
            response = model.generate_content([prompt, image_part], generation_config={"response_mime_type": "application/json"})

            # Lalu kamu bisa langsung panggil ini tanpa perlu if-else split string:
            ai_result = json.loads(response.text)

            # --- TAMBAHKAN DUA BARIS INI KEMBALI ---
            s3 = ai_result.get('s3_visual_inconsistency', 0)
            s4 = ai_result.get('s4_text_mismatch', 0)
            # ---------------------------------------
            
        except exceptions.ResourceExhausted:
            return jsonify({
                "status": "error",
                "message": "Gemini API quota exhausted. Please try again later.",
                "data": None
            }), 429
        except Exception as e:
            return jsonify({
                "status": "error",
                "message": f"AI Analysis failed: {str(e)}",
                "data": None
            }), 500

        # Aggregation
        total_score = s1 + s2 + s3 + s4
        category = get_risk_category(total_score)

        return jsonify({
            "status": "success",
            "message": "Claim analyzed successfully",
            "data": {
                "nomor_resi": nomor_resi,
                "scores": {
                    "s1_time_gap": s1,
                    "s2_repeat_claim": s2,
                    "s3_visual_inconsistency": s3,
                    "s4_text_mismatch": s4,
                    "total_score": total_score
                },
                "analysis": {
                    "category": category,
                    "ai_explanation": ai_result.get('ai_analysis'),
                    "policy_quote": ai_result.get('policy_quote')
                }
            }
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Internal server error: {str(e)}",
            "data": None
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
