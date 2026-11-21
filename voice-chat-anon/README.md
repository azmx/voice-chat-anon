# Ngobrol Suara Anonim

## Menjalankan
1. Pasang Node.js 18+ dari https://nodejs.org
2. Di folder ini jalankan:
   npm install
   npm start
3. Buka http://localhost:3000 di DUA tab/browser berbeda, tekan "Mulai" di keduanya.

## Dipakai dengan teman lewat internet
- Mikrofon butuh HTTPS (kecuali localhost). Deploy ke Render/Railway/Fly.io, atau pakai tunnel gratis:
  npx localtunnel --port 3000
- Jika sebagian pengguna gagal tersambung, tambahkan server TURN lewat environment variable:
  TURN_URL=turn:host:3478  TURN_USER=nama  TURN_PASS=sandi
