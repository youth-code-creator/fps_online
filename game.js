// 서버 URL
const socket = io('https://YOUR_VERCEL_SERVER_URL');

// 씬, 카메라, 렌더러
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 바닥
const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshBasicMaterial({color: 0x808080});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// 플레이어
const playerGeometry = new THREE.BoxGeometry(1, 2, 1);
const playerMaterial = new THREE.MeshBasicMaterial({color: 0x00ff00});
const player = new THREE.Mesh(playerGeometry, playerMaterial);
scene.add(player);

// 다른 플레이어 저장
const others = {};

// 카메라 초기 위치
camera.position.set(0, 2, 5);

// 이동
const keys = {};
document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// 총알
const bullets = [];
document.addEventListener('click', () => {
    const bullet = {
        pos: player.position.clone(),
        dir: new THREE.Vector3(0,0,-1).applyEuler(player.rotation).clone()
    };
    bullets.push(bullet);
    socket.emit('shoot', {pos: bullet.pos, dir: bullet.dir});
});

// 서버 위치 동기화
setInterval(() => {
    socket.emit('move', {x: player.position.x, y: player.position.y, z: player.position.z});
}, 50);

socket.on('updatePlayers', data => {
    for (let id in data) {
        if (id === socket.id) continue;
        if (!others[id]) {
            const geom = new THREE.BoxGeometry(1,2,1);
            const mat = new THREE.MeshBasicMaterial({color: 0xff0000});
            others[id] = new THREE.Mesh(geom, mat);
            scene.add(others[id]);
        }
        others[id].position.set(data[id].x, data[id].y, data[id].z);
    }
});

// 애니메이션
function animate() {
    requestAnimationFrame(animate);

    // 플레이어 이동
    if(keys['w']) player.position.z -= 0.1;
    if(keys['s']) player.position.z += 0.1;
    if(keys['a']) player.position.x -= 0.1;
    if(keys['d']) player.position.x += 0.1;

    // 총알 이동
    bullets.forEach((b, i) => {
        b.pos.addScaledVector(b.dir, 0.5);
        const bulletMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 8),
            new THREE.MeshBasicMaterial({color: 0xffff00})
        );
        bulletMesh.position.copy(b.pos);
        scene.add(bulletMesh);
        setTimeout(() => scene.remove(bulletMesh), 1000);
    });

    camera.position.set(player.position.x, player.position.y + 2, player.position.z + 5);
    camera.lookAt(player.position);

    renderer.render(scene, camera);
}

animate();
