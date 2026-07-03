import time
from cryptography.hazmat.primitives.asymmetric import ed25519, rsa, dsa, ec, padding
from cryptography.hazmat.primitives import hashes

def run_benchmark():
    ITERATIONS = 1000
    # Pesan simulasi (format message binding sistem Anda)
    message = b"text_hash=be879d9806717dc4121e0a778cc8c4c13d21d22db2ddc9c325806745c0ac03a832a89dfff3ab28a546a9c51b50dcaf8ee3b304201c2c303e9ff0e4c4bd83ac66|cert_id=CERT-20260623-A1B2C3"
    
    print(f"\n{'='*100}")
    print(f" BENCHMARK PERFORMA ALGORITMA DIGITAL SIGNATURE")
    print(f"{'='*100}")
    print(f" Panjang Pesan: {len(message)} bytes | Jumlah Iterasi: {ITERATIONS}")
    print(f"{'='*100}\n")

    # Header Tabel
    print(f"{'Algoritma':<20} | {'Ukuran Kunci':<12} | {'Hash':<8} | {'Key Gen (ms)':<12} | {'Signing (ms)':<12} | {'Verify (ms)':<12}")
    print("-" * 100)

    # 1. EdDSA (Ed25519) - Algoritma Utama Skripsi
    start = time.time()
    for _ in range(ITERATIONS):
        ed_private = ed25519.Ed25519PrivateKey.generate()
    ed_keygen = (time.time() - start) / ITERATIONS * 1000
    ed_signature = ed_private.sign(message)
    start = time.time()
    for _ in range(ITERATIONS):
        ed_private.sign(message)
    ed_sign = (time.time() - start) / ITERATIONS * 1000
    ed_public = ed_private.public_key()
    start = time.time()
    for _ in range(ITERATIONS):
        ed_public.verify(ed_signature, message)
    ed_verify = (time.time() - start) / ITERATIONS * 1000
    print(f"{'EdDSA (Ed25519)':<20} | {'256-bit':<12} | {'SHA-512':<8} | {ed_keygen:<12.4f} | {ed_sign:<12.4f} | {ed_verify:<12.4f}")

    # 2. RSA (2048-bit)
    start = time.time()
    for _ in range(ITERATIONS):
        rsa_private = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    rsa_keygen = (time.time() - start) / ITERATIONS * 1000
    rsa_signature = rsa_private.sign(message, padding.PKCS1v15(), hashes.SHA256())
    start = time.time()
    for _ in range(ITERATIONS):
        rsa_private.sign(message, padding.PKCS1v15(), hashes.SHA256())
    rsa_sign = (time.time() - start) / ITERATIONS * 1000
    rsa_public = rsa_private.public_key()
    start = time.time()
    for _ in range(ITERATIONS):
        rsa_public.verify(rsa_signature, message, padding.PKCS1v15(), hashes.SHA256())
    rsa_verify = (time.time() - start) / ITERATIONS * 1000
    print(f"{'RSA (2048-bit)':<20} | {'2048-bit':<12} | {'SHA-256':<8} | {rsa_keygen:<12.4f} | {rsa_sign:<12.4f} | {rsa_verify:<12.4f}")

    # 3. DSA (2048-bit)
    start = time.time()
    for _ in range(ITERATIONS):
        dsa_private = dsa.generate_private_key(key_size=2048)
    dsa_keygen = (time.time() - start) / ITERATIONS * 1000
    dsa_signature = dsa_private.sign(message, hashes.SHA256())
    start = time.time()
    for _ in range(ITERATIONS):
        dsa_private.sign(message, hashes.SHA256())
    dsa_sign = (time.time() - start) / ITERATIONS * 1000
    dsa_public = dsa_private.public_key()
    start = time.time()
    for _ in range(ITERATIONS):
        dsa_public.verify(dsa_signature, message, hashes.SHA256())
    dsa_verify = (time.time() - start) / ITERATIONS * 1000
    print(f"{'DSA (2048-bit)':<20} | {'2048-bit':<12} | {'SHA-256':<8} | {dsa_keygen:<12.4f} | {dsa_sign:<12.4f} | {dsa_verify:<12.4f}")

    # 4. ECDSA (P-256)
    start = time.time()
    for _ in range(ITERATIONS):
        ec_p256_private = ec.generate_private_key(ec.SECP256R1())
    ec_p256_keygen = (time.time() - start) / ITERATIONS * 1000
    ec_p256_signature = ec_p256_private.sign(message, ec.ECDSA(hashes.SHA256()))
    start = time.time()
    for _ in range(ITERATIONS):
        ec_p256_private.sign(message, ec.ECDSA(hashes.SHA256()))
    ec_p256_sign = (time.time() - start) / ITERATIONS * 1000
    ec_p256_public = ec_p256_private.public_key()
    start = time.time()
    for _ in range(ITERATIONS):
        ec_p256_public.verify(ec_p256_signature, message, ec.ECDSA(hashes.SHA256()))
    ec_p256_verify = (time.time() - start) / ITERATIONS * 1000
    print(f"{'ECDSA (P-256)':<20} | {'256-bit':<12} | {'SHA-256':<8} | {ec_p256_keygen:<12.4f} | {ec_p256_sign:<12.4f} | {ec_p256_verify:<12.4f}")

    # 5. ECDSA (secp256k1)
    start = time.time()
    for _ in range(ITERATIONS):
        ec_k1_private = ec.generate_private_key(ec.SECP256K1())
    ec_k1_keygen = (time.time() - start) / ITERATIONS * 1000
    ec_k1_signature = ec_k1_private.sign(message, ec.ECDSA(hashes.SHA256()))
    start = time.time()
    for _ in range(ITERATIONS):
        ec_k1_private.sign(message, ec.ECDSA(hashes.SHA256()))
    ec_k1_sign = (time.time() - start) / ITERATIONS * 1000
    ec_k1_public = ec_k1_private.public_key()
    start = time.time()
    for _ in range(ITERATIONS):
        ec_k1_public.verify(ec_k1_signature, message, ec.ECDSA(hashes.SHA256()))
    ec_k1_verify = (time.time() - start) / ITERATIONS * 1000
    print(f"{'ECDSA (secp256k1)':<20} | {'256-bit':<12} | {'SHA-256':<8} | {ec_k1_keygen:<12.4f} | {ec_k1_sign:<12.4f} | {ec_k1_verify:<12.4f}")

    print(f"{'='*100}")

if __name__ == "__main__":
    run_benchmark()