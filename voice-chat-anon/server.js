const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

// Konfigurasi ICE. STUN gratis dari Google; TURN opsional lewat environment variable.
app.get("/ice-config", (req, res) => {
  const iceServers = [{ urls: "stun:stun.l.google.com:19302" }];
  if (process.env.TURN_URL) {
    iceServers.push({
      urls: process.env.TURN_URL.split(","),
      username: process.env.TURN_USER,
      credential: process.env.TURN_PASS,
    });
  }
  res.json({ iceServers });
});

let waiting = []; // antrean socket id
const partners = new Map(); // socket id -> socket id lawan

const dequeue = (id) => {
  waiting = waiting.filter((x) => x !== id);
};
const unpair = (id) => {
  const p = partners.get(id);
  if (p) {
    partners.delete(id);
    partners.delete(p);
    io.to(p).emit("peer-left");
  }
};
const broadcastOnline = () => io.emit("online", io.engine.clientsCount);

io.on("connection", (socket) => {
  broadcastOnline();
  console.log(`[masuk] ${socket.id} (online: ${io.engine.clientsCount})`);

  socket.on("search", () => {
    unpair(socket.id);
    dequeue(socket.id);
    // cari lawan yang masih terhubung
    let peer = null;
    while (waiting.length && !peer) {
      const candidate = waiting.shift();
      if (io.sockets.sockets.has(candidate) && candidate !== socket.id)
        peer = candidate;
    }
    if (peer) {
      console.log(`[match] ${socket.id} <-> ${peer}`);
      partners.set(socket.id, peer);
      partners.set(peer, socket.id);
      socket.emit("matched", { initiator: true });
      io.to(peer).emit("matched", { initiator: false });
    } else {
      waiting.push(socket.id);
    }
  });

  // Teruskan pesan WebRTC ke lawan. ID asli tidak pernah dibagikan ke klien.
  socket.on("signal", (data) => {
    const p = partners.get(socket.id);
    if (p) io.to(p).emit("signal", data);
  });

  socket.on("report", () => {
    const p = partners.get(socket.id);
    if (p) console.log(`[report] ${socket.id} melaporkan ${p}`);
  });

  socket.on("leave", () => {
    dequeue(socket.id);
    unpair(socket.id);
  });

  socket.on("disconnect", () => {
    console.log(`[keluar] ${socket.id}`);
    dequeue(socket.id);
    unpair(socket.id);
    broadcastOnline();
  });
});

server.listen(PORT, () => console.log(`Berjalan di http://localhost:${PORT}`));
