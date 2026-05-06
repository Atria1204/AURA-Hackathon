import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from datetime import datetime

app = Flask(__name__)
CORS(app)

# --- 1. SETUP GEMINI 2.0 FLASH ---
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    # Sesuai proposal, kita pakai model 2.0 Flash untuk reasoning multimodal
    model = genai.GenerativeModel('gemini-2.0-flash') 
else:
    model = None

# --- 2. DATASET SIMULASI (Mock Firestore) ---
# Sesuai proposal Bab 6: Berisi Dummy Order untuk kalkulasi S1 (Time Gap) & S2 (Repeat Claim)
MOCK_FIRESTORE = {
    "TKP-2026-001": {
        "tanggal_beli": "2026-05-01", 
        "produk": "Jaket Denim Series B",
        "riwayat_klaim_90hari": 0
    },
    "TKP-FRAUD-99": {
        "tanggal_beli": "2026-03-15", 
        "produk": "Kaos Polos Hitam",
        "riwayat_klaim_90hari": 2 # Akan memicu Sinyal S2
    }
}

# --- 3. PAG CORPUS (Kebijakan Toko) ---
# Dimuat ke Long Context Window Gemini sesuai proposal Bab 5
TOKO_POLICY = """
KEBIJAKAN RETUR TOKO AURAFARMINGLOHYA:
Pasal 1: Batas waktu klaim retur maksimal adalah 7 hari setelah pesanan dikonfirmasi.
Pasal 2: Cacat minor (noda < 3cm, jahitan lepas) memenuhi syarat kompensasi parsial (Partial Refund) maksimal Rp 50.000.
Pasal 3: Cacat mayor (robek besar, barang salah varian) berhak mendapatkan Full Refund atau Tukar Barang.
Pasal 4: Inkonsistensi warna akibat pencahayaan wajar tidak dianggap cacat.
Pasal 5: Keputusan akhir berada di tangan admin. Segala bentuk manipulasi foto atau penipuan (item switching) akan ditolak.
"""

# --- ENDPOINT UTAMA A.U.R.A ---
@app.route('/api/claim', methods=['POST'])
def process_claim():
    if not model:
         return jsonify({"error": "API Key Gemini belum diset!"}), 500

    try:
        data = request.get_json()
        resi = data.get('nomor_resi')
        teks_keluhan = data.get('keluhan')
        # Untuk demo MVP: foto dikirim sebagai URL atau deskripsi teks sementara
        # Nanti Arthur bisa integrasikan base64 ke parameter ini
        foto_klaim = data.get('foto_base64', 'Tidak ada foto dilampirkan') 

        if not resi or not teks_keluhan:
            return jsonify({"error": "Nomor resi dan teks keluhan wajib diisi"}), 400

        # TAHAP 2: ORDER LOOKUP
        order_data = MOCK_FIRESTORE.get(resi)
        if not order_data:
            return jsonify({"error": "Nomor resi tidak ditemukan di database"}), 404

        # TAHAP 5: FRAUD SCORE CALCULATION (S1 & S2 di Backend)
        s1_score = 0
        s2_score = 0
        
        # Kalkulasi S2: Repeat Claim History (Maks 3 Poin)
        if order_data['riwayat_klaim_90hari'] > 1:
            s2_score = 3
        elif order_data['riwayat_klaim_90hari'] == 1:
            s2_score = 1

        # TAHAP 4: MULTIMODAL ANALYSIS & PAG (S3 & S4 oleh Gemini)
        prompt_ai = f"""
        Anda adalah A.U.R.A, AI verifikasi retur e-commerce. 
        Tugas Anda adalah membaca konteks, menganalisis klaim, dan memberikan rekomendasi bagi admin.
        
        [KEBIJAKAN TOKO (PAG CONTEXT)]
        {TOKO_POLICY}

        [DATA KLAIM CUSTOMER]
        Produk: {order_data['produk']}
        Keluhan Teks: "{teks_keluhan}"
        Data Foto Visual: "{foto_klaim}"

        Instruksi: Evaluasi data di atas dan berikan skor untuk:
        - S3 (Visual Inconsistency): 0-3 poin. Apakah foto menunjukkan manipulasi atau keausan tidak wajar?
        - S4 (Text-Visual Mismatch): 0-2 poin. Apakah teks keluhan cocok dengan kerusakan di foto?
        
        Berikan jawaban akhir HANYA dalam format JSON dengan key:
        "s3_score" (int), "s4_score" (int), "analisis_visual" (string singkat), "kutipan_kebijakan" (string referensi pasal), "rekomendasi" (string).
        Pastikan outputnya murni JSON tanpa backtick atau markdown.
        """

        response = model.generate_content(prompt_ai)
        ai_result_text = response.text.strip()
        
        # Bersihkan format JSON dari Gemini kalau ada sisa markdown
        if ai_result_text.startswith("```json"):
            ai_result_text = ai_result_text[7:-3]
            
        import json
        ai_data = json.loads(ai_result_text)

        # Total Fraud Score
        total_score = s1_score + s2_score + ai_data.get('s3_score', 0) + ai_data.get('s4_score', 0)

        # TAHAP 6: REPORT DELIVERY
        return jsonify({
            "status": "success",
            "data_order": {
                "nomor_resi": resi,
                "produk": order_data['produk'],
                "tanggal_beli": order_data['tanggal_beli']
            },
            "fraud_score": {
                "total": total_score,
                "breakdown": {
                    "S1_TimeGap": s1_score,
                    "S2_RepeatClaim": s2_score,
                    "S3_VisualInconsistency": ai_data.get('s3_score', 0),
                    "S4_TextVisualMismatch": ai_data.get('s4_score', 0)
                }
            },
            "analisis": {
                "visual": ai_data.get('analisis_visual', ''),
                "kebijakan_relevan": ai_data.get('kutipan_kebijakan', ''),
                "rekomendasi_resolusi": ai_data.get('rekomendasi', '')
            }
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"message": "A.U.R.A Core System is Live!"}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(debug=True, host='0.0.0.0', port=port)