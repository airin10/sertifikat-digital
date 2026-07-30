# Tombol start Untuk menjalankan aplikasi backend FastAPI 

# ASGI server (Asynchronous Server Gateway Interface) yang digunakan untuk menjalankan aplikasi FastAPI
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app", # file main.py di dalam folder app/
        host="0.0.0.0",  # terima koneksi dari mana saja
        port=8000, #default port untuk FastAPI/uvicorn
        reload=True, # Server akan otomatis restart saat ada perubahan di kode Python
        log_level="info" # detail log yang ditampilkan
    )