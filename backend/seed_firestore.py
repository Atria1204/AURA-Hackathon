import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore

# Pastikan environment variable MOCK_DB=false untuk connect ke Firestore
load_dotenv()
os.environ["MOCK_DB"] = "false"

# Setup credentials
try:
    sa_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
    if sa_path and os.path.exists(sa_path):
        cred = credentials.Certificate(sa_path)
        print(f"Menggunakan service account: {sa_path}")
    else:
        cred = credentials.ApplicationDefault()
        print("Menggunakan Application Default Credentials.")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("[OK] Berhasil terhubung ke Firestore!")
except Exception as e:
    print(f"[ERROR] Error menghubungkan ke Firestore.\nError: {e}")
    exit(1)

# --- Data Orders ---
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

# --- Data Claims ---
dummy_claims = [
    { 
        "id": "CLM-9921", 
        "resi": "TKP-2026-001", 
        "receipt": "RCPT-445102", 
        "product": "Pro Audio ANC Headphones", 
        "category": "Electronics", 
        "date": "Oct 24, 2023", 
        "time": "10:42 AM", 
        "score": 96, 
        "image": 'https://lh3.googleusercontent.com/aida-public/AB6AXuCb8q4jqUsa_lDSQUkuCDJlzouO1I5MC08C3C14vYtU9sput3hg-YAva44R0CCQgYYXsHUtXIoaI69g_lPsGRsmIaGaUFEyeY5F5sV3wkjgcfb3ByCeakX1BbDRsSGfYox4gyrhmt7tD8CslZTTX5_NSwEazpoqONjIegtDqDXO_5ZFkAvnZkqBlJlNY-xYKqJ85jWqHlBimYbqGJGmKgL88bfvqxq8IXaorAgGDwZlKE9pbgfO7X47bYmplqgzjLtsXMDEXHHjA3TT', 
        "status_klaim": "PENDING_REVIEW", 
        "teks_keluhan": "Baret di samping", 
        "signals": {"S1": "Pass", "S2": "Pass", "S3": "Pass", "S4": "Pass"},
        "ai_analysis": "Analisis manual.",
        "policy_quote": "Kerusakan minor dapat dikompensasi.",
        "created_at": "2023-10-24T10:42:00"
    },
    { 
        "id": "CLM-9920", 
        "resi": "TKP-2026-002", 
        "receipt": "RCPT-445088", 
        "product": "AeroRun Elite Sneakers", 
        "category": "Footwear", 
        "date": "Oct 24, 2023", 
        "time": "09:15 AM", 
        "score": 65, 
        "image": 'https://lh3.googleusercontent.com/aida-public/AB6AXuA91gOX-A3MJE4hDAfX6fNyPTYG21d7ZoVSJhh8WyrsFFq31e8saVVnErAEBHZTj7b3WGt_EC4wpaOeCPnuQ6h9G-eru98KM1HInfAwxKDuNANFQTwZ43L99SsGCQ0UGcID1SKtgU4H7oAYvnqAeINiel_K25smmITU9al8d2rsvsU35y_yaMvDuKUwbkCVoPY4EWkDprxCrsOS2kHTK3v3g3TY2URUDMQS4k8-SJLrgdC4Hj8cpnrWYpgdQbnjmXZjaW_ST925EYdJ', 
        "status_klaim": "PENDING_REVIEW", 
        "teks_keluhan": "Lem lepas", 
        "signals": {"S1": "Pass", "S2": "Pass", "S3": "Flagged", "S4": "Pass"},
        "ai_analysis": "Ada indikasi lem lepas tidak wajar.",
        "policy_quote": "Harus direview lebih lanjut.",
        "created_at": "2023-10-24T09:15:00"
    }
]

print("\nMenyimpan Orders...")
for resi, data in MOCK_ORDERS.items():
    db.collection("orders").document(resi).set(data)
    print(f"  - Disimpan order {resi}")

print("\nMenyimpan Claims...")
for claim in dummy_claims:
    db.collection("claims").document(claim["id"]).set(claim)
    print(f"  - Disimpan klaim {claim['id']}")

print("\nSelesai! Database Firestore sudah di-seed.")
