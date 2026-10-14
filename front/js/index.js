// index.js  (página index.html, a propaganda)
// 1. a boneca, o rosto do fundo e o título seguem o mouse (parallax)
// 2. as pétalas caindo (desenhadas num <canvas>)
// 3. a vitrine de classes: clicar numa miniatura mostra aquela classe

var hero = document.getElementById('hero');
var charLayer = document.getElementById('character-layer');
var bgDoll = document.getElementById('bg-doll');
var titleLayer = document.getElementById('title-layer');

// --- bonecas e título seguindo o mouse ---
var mouseX = 0, mouseY = 0;
var charX = 0, charY = 0, bgX = 0, bgY = 0, tX = 0, tY = 0, wind = 0;

document.addEventListener('mousemove', function (e) {
    mouseX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
    mouseY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
});

function updateParallax() {
    charX += (mouseX * 18 - charX) * 0.08;   // boneca da frente vai junto com o mouse
    charY += (mouseY * 12 - charY) * 0.08;
    bgX += (-mouseX * 8 - bgX) * 0.05;       // rosto de fundo vai pro lado contrário
    bgY += (-mouseY * 5 - bgY) * 0.05;
    tX += (-mouseX * 6 - tX) * 0.06;         // título mexe bem de leve
    tY += (-mouseY * 4 - tY) * 0.06;
    wind += (-mouseX * 10 - wind) * 0.05;    // vento das pétalas

    charLayer.style.transform = 'translate(' + charX + 'px, ' + charY + 'px)';
    bgDoll.style.transform = 'translate(' + bgX + 'px, ' + bgY + 'px)';
    titleLayer.style.transform = 'translate(' + tX + 'px, ' + tY + 'px)';
    requestAnimationFrame(updateParallax);
}
updateParallax();

// --- pétalas ---
var petalCanvas = document.getElementById('petals-canvas');
var ctx = petalCanvas.getContext('2d');

function resizeCanvas() {
    petalCanvas.width = hero.clientWidth;
    petalCanvas.height = hero.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

var petalColors = ['rgba(225, 106, 92, 0.38)', 'rgba(92, 15, 43, 0.22)', 'rgba(236, 160, 175, 0.40)'];
var petals = [];

function newPetal() {
    return {
        x: Math.random() * petalCanvas.width,
        y: Math.random() * -petalCanvas.height,
        size: Math.random() * 5 + 3,
        speedY: Math.random() * 0.7 + 0.3,
        speedX: Math.random() * 0.4 - 0.2,
        angle: Math.random() * 360,
        spin: Math.random() * 0.8 - 0.4,
        color: petalColors[Math.floor(Math.random() * petalColors.length)]
    };
}
for (var i = 0; i < 34; i++) petals.push(newPetal());

function animatePetals() {
    ctx.clearRect(0, 0, petalCanvas.width, petalCanvas.height);
    for (var i = 0; i < petals.length; i++) {
        var p = petals[i];
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.y / 40) * 0.25 + wind * 0.02;
        p.angle += p.spin;
        if (p.y > petalCanvas.height + 10) { p.y = -10; p.x = Math.random() * petalCanvas.width; }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size / 1.8, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
    }
    requestAnimationFrame(animatePetals);
}
animatePetals();


// --- vitrine de classes ---
// As 6 classes já estão no HTML (classeFoto1..6, classeTexto1..6, classeBotao1..6).
// Esconde todas e mostra só a escolhida: só coloca e tira classes.
function mostrarClasse(numero){
    for(var i = 1; i <= 6; i++){
        document.getElementById('classeFoto' + i).classList.add('oculto')
        document.getElementById('classeTexto' + i).classList.add('oculto')
        document.getElementById('classeBotao' + i).classList.remove('ativo')
    }

    document.getElementById('classeFoto' + numero).classList.remove('oculto')
    document.getElementById('classeTexto' + numero).classList.remove('oculto')
    document.getElementById('classeBotao' + numero).classList.add('ativo')
}
