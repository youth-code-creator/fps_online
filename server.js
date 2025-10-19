import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Vercel에서 접근 허용 (테스트용)
  },
});

// 클라이언트용 정적 파일 (테스트용)
app.use(express.static(__dirname));

const players = {}; // 모든 플레이어 위치 저장

io.on("connection", (socket) => {
  console.log("✅ 유저 접속:", socket.id);

  // 새 플레이어 등록
  players[socket.id] = { x: 0, y: 1, z: 0 };
  io.emit("updatePlayers", players);

  // 이동 정보 수신
  socket.on("move", (data) => {
    if (players[socket.id]) {
      players[socket.id] = data;
      io.emit("updatePlayers", players);
    }
  });

  // 총알 발사
  socket.on("shoot", (bullet) => {
    socket.broadcast.emit("shoot", bullet);
  });

  // 퇴장
  socket.on("disconnect", () => {
    console.log("❌ 유저 퇴장:", socket.id);
    delete players[socket.id];
    io.emit("updatePlayers", players);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🌍 서버 실행중: http://localhost:${PORT}`));
