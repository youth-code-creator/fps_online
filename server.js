// server.js
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;

// 정적 파일 서비스
app.use(express.static(__dirname + '/public'));

// 플레이어 상태 저장
let players = {};

io.on('connection', socket => {
    console.log(`Player connected: ${socket.id}`);
    // 새 플레이어 추가
    players[socket.id] = { x:0, y:2, z:0, rotY:0, health:100 };

    // 모든 클라이언트에 새 플레이어 정보 전송
    io.emit('updatePlayers', players);

    // 클라이언트 위치 업데이트 수신
    socket.on('move', data => {
        if(players[socket.id]){
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].z = data.z;
            players[socket.id].rotY = data.rotY;
        }
        io.emit('updatePlayers', players);
    });

    // 클라이언트 총알 발사
    socket.on('shoot', data => {
        io.emit('bullet', { id: socket.id, x:data.x, y:data.y, z:data.z, dir:data.dir });
    });

    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        delete players[socket.id];
        io.emit('updatePlayers', players);
    });
});

http.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
