// Oyun değişkenleri
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Mobil cihazlar için canvas boyutunu ayarla
function resizeCanvas() {
    const container = canvas.parentElement;
    const maxWidth = Math.min(800, window.innerWidth - 40);
    const maxHeight = Math.min(600, window.innerHeight - 200);
    
    canvas.width = maxWidth;
    canvas.height = maxHeight;
    
    // Oyuncu pozisyonunu güncelle
    if (player) {
        player.x = canvas.width / 2;
        player.y = canvas.height - 100;
    }
}

// Sayfa yüklendiğinde ve boyut değiştiğinde canvas'ı yeniden boyutlandır
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);

// Oyun durumu
let gameRunning = false; // Başlangıçta oyun durdurulmuş
let gameStarted = false; // Oyun başlatıldı mı?
let score = 0;
let lives = 3;
let gameSpeed = 5;

// En yüksek skor
let highScore = localStorage.getItem('highScore') || 0;

// Oyuncu arabası
const player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: 50,
    height: 80,
    speed: 5
};

// Engeller dizisi
let obstacles = [];
let powerUps = [];

// Tuş kontrolleri
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    KeyA: false,
    KeyD: false,
    KeyW: false,
    KeyS: false
};

// Mobil touch kontrolleri
let touchStartX = 0;
let touchStartY = 0;
let touchActive = false;
let touchDirection = { x: 0, y: 0 };

// Tuş dinleyicileri
document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = false;
    }
});

// Touch event listener'ları
canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

// Mobil cihaz kontrolü
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Mobil cihazlarda touch kontrollerini aktif et
if (isMobile) {
    // Mobil cihazlarda daha iyi performans için
    canvas.style.touchAction = 'none';
}

// Touch başlangıcı
function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchActive = true;
    touchDirection = { x: 0, y: 0 };
}

// Touch hareketi
function handleTouchMove(e) {
    e.preventDefault();
    if (!touchActive) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    
    // Minimum hareket mesafesi (mobil için daha hassas)
    const minDistance = 5;
    
    if (Math.abs(deltaX) > minDistance || Math.abs(deltaY) > minDistance) {
        // Hangi yönde daha fazla hareket var?
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Yatay hareket
            touchDirection.x = deltaX > 0 ? 1 : -1;
            touchDirection.y = 0;
        } else {
            // Dikey hareket
            touchDirection.x = 0;
            touchDirection.y = deltaY > 0 ? 1 : -1;
        }
        
        // Touch feedback için canvas'a visual indicator ekle
        showTouchFeedback(touch.clientX, touch.clientY);
    }
}

// Touch feedback gösterme
function showTouchFeedback(x, y) {
    // Touch noktasında küçük bir daire çiz
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#F1C40F';
    ctx.beginPath();
    ctx.arc(x - canvas.offsetLeft, y - canvas.offsetTop, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// Touch bitişi
function handleTouchEnd(e) {
    e.preventDefault();
    touchActive = false;
    touchDirection = { x: 0, y: 0 };
}

// Engelleri oluştur
function createObstacle() {
    const types = ['car', 'truck', 'cone'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let width, height, color;
    switch(type) {
        case 'car':
            width = 50;
            height = 80;
            color = '#FF6B6B';
            break;
        case 'truck':
            width = 70;
            height = 100;
            color = '#4ECDC4';
            break;
        case 'cone':
            width = 30;
            height = 40;
            color = '#FFE66D';
            break;
    }
    
    obstacles.push({
        x: Math.random() * (canvas.width - width),
        y: -height,
        width: width,
        height: height,
        color: color,
        type: type
    });
}

// Güçlendiricileri oluştur
function createPowerUp() {
    if (Math.random() < 0.02) { // %2 şans
        powerUps.push({
            x: Math.random() * (canvas.width - 30),
            y: -30,
            width: 30,
            height: 30,
            type: Math.random() < 0.5 ? 'heart' : 'speed'
        });
    }
}

// Oyuncu arabasını çiz (Ferrari)
function drawPlayer() {
    // Ferrari gövdesi (kırmızı)
    ctx.fillStyle = '#E74C3C';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Ferrari üst kısmı (siyah)
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(player.x + 8, player.y + 8, player.width - 16, 25);
    
    // Ön cam (siyah)
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(player.x + 10, player.y + 10, player.width - 20, 20);
    
    // Yan camlar (siyah)
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(player.x + 5, player.y + 35, 15, 20);
    ctx.fillRect(player.x + player.width - 20, player.y + 35, 15, 20);
    
    // Ferrari logosu (sarı)
    ctx.fillStyle = '#F1C40F';
    ctx.fillRect(player.x + player.width/2 - 8, player.y + 15, 16, 8);
    
    // Tekerler (siyah)
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(player.x - 8, player.y + 12, 12, 24);
    ctx.fillRect(player.x + player.width - 4, player.y + 12, 12, 24);
    ctx.fillRect(player.x - 8, player.y + 48, 12, 24);
    ctx.fillRect(player.x + player.width - 4, player.y + 48, 12, 24);
    
    // Teker jantları (gümüş)
    ctx.fillStyle = '#BDC3C7';
    ctx.fillRect(player.x - 6, player.y + 14, 8, 20);
    ctx.fillRect(player.x + player.width - 2, player.y + 14, 8, 20);
    ctx.fillRect(player.x - 6, player.y + 50, 8, 20);
    ctx.fillRect(player.x + player.width - 2, player.y + 50, 8, 20);
    
    // Ön farlar (sarı)
    ctx.fillStyle = '#F1C40F';
    ctx.fillRect(player.x + 8, player.y + player.height - 18, 18, 12);
    ctx.fillRect(player.x + player.width - 26, player.y + player.height - 18, 18, 12);
    
    // Arka farlar (kırmızı)
    ctx.fillStyle = '#C0392B';
    ctx.fillRect(player.x + 8, player.y - 5, 18, 8);
    ctx.fillRect(player.x + player.width - 26, player.y - 5, 18, 8);
    
    // Egzoz (gümüş)
    ctx.fillStyle = '#95A5A6';
    ctx.fillRect(player.x + player.width/2 - 3, player.y - 8, 6, 8);
}

// Engelleri çiz
function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.fillStyle = obstacle.color;
        
        if (obstacle.type === 'cone') {
            // Koni şekli
            ctx.beginPath();
            ctx.moveTo(obstacle.x + obstacle.width/2, obstacle.y);
            ctx.lineTo(obstacle.x, obstacle.y + obstacle.height);
            ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
            ctx.closePath();
            ctx.fill();
        } else {
            // Dikdörtgen araçlar
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // Araç detayları
            ctx.fillStyle = '#87CEEB';
            ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, 15);
            ctx.fillRect(obstacle.x + 5, obstacle.y + 25, obstacle.width - 10, 15);
        }
    });
}

// Güçlendiricileri çiz
function drawPowerUps() {
    powerUps.forEach(powerUp => {
        if (powerUp.type === 'heart') {
            ctx.fillStyle = '#E74C3C';
            // Kalp şekli
            ctx.beginPath();
            ctx.moveTo(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/4);
            ctx.quadraticCurveTo(powerUp.x + powerUp.width/2, powerUp.y, powerUp.x + powerUp.width/4, powerUp.y);
            ctx.quadraticCurveTo(powerUp.x, powerUp.y, powerUp.x, powerUp.y + powerUp.height/4);
            ctx.quadraticCurveTo(powerUp.x, powerUp.y + powerUp.height/2, powerUp.x + powerUp.width/2, powerUp.y + powerUp.height);
            ctx.quadraticCurveTo(powerUp.x + powerUp.width, powerUp.y + powerUp.height/2, powerUp.x + powerUp.width, powerUp.y + powerUp.height/4);
            ctx.quadraticCurveTo(powerUp.x + powerUp.width, powerUp.y, powerUp.x + powerUp.width*3/4, powerUp.y);
            ctx.quadraticCurveTo(powerUp.x + powerUp.width/2, powerUp.y, powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/4);
            ctx.fill();
        } else {
            ctx.fillStyle = '#9B59B6';
            // Hız simgesi
            ctx.fillRect(powerUp.x + 5, powerUp.y + 5, 20, 20);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(powerUp.x + 10, powerUp.y + 10, 10, 10);
        }
    });
}

// Yolu çiz
function drawRoad() {
    // Ana yol
    ctx.fillStyle = '#34495E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Yol çizgileri
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 5;
    ctx.setLineDash([20, 20]);
    
    for (let i = 0; i < canvas.height; i += 40) {
        ctx.beginPath();
        ctx.moveTo(canvas.width/2, i);
        ctx.lineTo(canvas.width/2, i + 20);
        ctx.stroke();
    }
    
    ctx.setLineDash([]);
}

// Çarpışma kontrolü
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Oyun güncelleme
function updateGame() {
    if (!gameRunning) return;
    
    // Oyuncu hareketi (klavye + touch)
    let moveX = 0;
    let moveY = 0;
    
    // Klavye kontrolleri
    if (keys.ArrowLeft || keys.KeyA) moveX -= 1;
    if (keys.ArrowRight || keys.KeyD) moveX += 1;
    if (keys.ArrowUp || keys.KeyW) moveY -= 1;
    if (keys.ArrowDown || keys.KeyS) moveY += 1;
    
    // Touch kontrolleri
    if (touchActive) {
        moveX += touchDirection.x;
        moveY += touchDirection.y;
        
        // Mobil cihazlarda daha hassas kontrol
        if (isMobile) {
            moveX *= 1.5;
            moveY *= 1.5;
        }
    }
    
    // Hareketi uygula
    if (moveX < 0 && player.x > 0) {
        player.x -= player.speed;
    }
    if (moveX > 0 && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
    if (moveY < 0 && player.y > 0) {
        player.y -= player.speed;
    }
    if (moveY > 0 && player.y < canvas.height - player.height) {
        player.y += player.speed;
    }
    
    // Engelleri hareket ettir
    obstacles.forEach((obstacle, index) => {
        obstacle.y += gameSpeed;
        
        // Ekrandan çıkan engelleri sil
        if (obstacle.y > canvas.height) {
            obstacles.splice(index, 1);
            score += 10;
        }
        
        // Çarpışma kontrolü
        if (checkCollision(player, obstacle)) {
            lives--;
            obstacles.splice(index, 1);
            
            if (lives <= 0) {
                gameOver();
            }
        }
    });
    
    // Güçlendiricileri hareket ettir
    powerUps.forEach((powerUp, index) => {
        powerUp.y += gameSpeed;
        
        // Ekrandan çıkan güçlendiricileri sil
        if (powerUp.y > canvas.height) {
            powerUps.splice(index, 1);
        }
        
        // Çarpışma kontrolü
        if (checkCollision(player, powerUp)) {
            if (powerUp.type === 'heart') {
                lives = Math.min(lives + 1, 5);
            } else {
                gameSpeed += 1;
            }
            powerUps.splice(index, 1);
        }
    });
    
    // Yeni engeller oluştur (sadece oyun başladıktan sonra)
    if (gameStarted && Math.random() < 0.02) {
        createObstacle();
    }
    
    // Yeni güçlendiriciler oluştur (sadece oyun başladıktan sonra)
    if (gameStarted) {
        createPowerUp();
    }
    
    // Skoru güncelle
    document.getElementById('score').textContent = score;
    document.getElementById('speed').textContent = gameSpeed * 10;
    document.getElementById('lives').textContent = lives;
}

// Oyunu çiz
function drawGame() {
    // Ekranı temizle
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Yolu çiz
    drawRoad();
    
    // Engelleri çiz
    drawObstacles();
    
    // Güçlendiricileri çiz
    drawPowerUps();
    
    // Oyuncuyu çiz
    drawPlayer();
}

// Oyun döngüsü
function gameLoop() {
    updateGame();
    drawGame();
    requestAnimationFrame(gameLoop);
}

// Oyun bitti
function gameOver() {
    gameRunning = false;
    
    // En yüksek skoru kontrol et ve güncelle
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('highScore').textContent = highScore;
    document.getElementById('gameOver').style.display = 'block';
    
    // Era7cappone - Sonbahar şarkısını çal
    const gameOverMusic = document.getElementById('gameOverMusic');
    if (gameOverMusic) {
        gameOverMusic.currentTime = 0; // Şarkıyı baştan başlat
        gameOverMusic.play().catch(e => console.log('Müzik çalınamadı:', e));
    }
}

// Oyunu başlat
function startGame() {
    gameRunning = true;
    gameStarted = true;
    document.getElementById('startScreen').style.display = 'none';
    
    // Müziği durdur (eğer çalıyorsa)
    const gameOverMusic = document.getElementById('gameOverMusic');
    if (gameOverMusic) {
        gameOverMusic.pause();
        gameOverMusic.currentTime = 0;
    }
    
    // Oyunu sıfırla
    score = 0;
    lives = 3;
    gameSpeed = 5;
    obstacles = [];
    powerUps = [];
    
    player.x = canvas.width / 2;
    player.y = canvas.height - 100;
    
    // En yüksek skoru güncelle
    highScore = localStorage.getItem('highScore') || 0;
    
    // Canvas boyutunu güncelle
    resizeCanvas();
}

// Oyunu yeniden başlat
function restartGame() {
    gameRunning = false;
    gameStarted = false;
    score = 0;
    lives = 3;
    gameSpeed = 5;
    obstacles = [];
    powerUps = [];
    
    player.x = canvas.width / 2;
    player.y = canvas.height - 100;
    
    // Müziği durdur
    const gameOverMusic = document.getElementById('gameOverMusic');
    if (gameOverMusic) {
        gameOverMusic.pause();
        gameOverMusic.currentTime = 0;
    }
    
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('startScreen').style.display = 'block';
    
    // En yüksek skoru güncelle
    updateHighScoreDisplay();
    
    // Canvas boyutunu güncelle
    resizeCanvas();
}

// En yüksek skoru göster
function updateHighScoreDisplay() {
    const startHighScore = document.getElementById('startHighScore');
    if (startHighScore) {
        startHighScore.textContent = highScore;
    }
}

// Sayfa yüklendiğinde en yüksek skoru göster ve canvas'ı boyutlandır
document.addEventListener('DOMContentLoaded', () => {
    updateHighScoreDisplay();
    resizeCanvas();
});

// Oyunu başlat
gameLoop();
