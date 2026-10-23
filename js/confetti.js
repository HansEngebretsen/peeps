// ==========================================================================
// Confetti (party mode)
// ==========================================================================

class ConfettiEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.active = false;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    resize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }
    start() { if (this.active) return; this.active = true; this.loop(); }
    stop() { this.active = false; this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); this.particles = []; }
    loop() {
        if (!this.active) return;
        requestAnimationFrame(() => this.loop());
        this.update(); this.draw();
    }
    update() {
        if (this.particles.length < 150) {
            this.particles.push({
                x: Math.random() * this.canvas.width, y: -20,
                size: Math.random() * 8 + 4,
                color: rnd(CONFIG.bgColors),
                speed: Math.random() * 3 + 2,
                wobble: Math.random() * Math.PI * 2, wobbleSpeed: 0.1
            });
        }
        this.particles.forEach(p => {
            p.y += p.speed; p.wobble += p.wobbleSpeed; p.x += Math.sin(p.wobble) * 2;
        });
        this.particles = this.particles.filter(p => p.y <= this.canvas.height);
    }
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color; this.ctx.fillRect(p.x, p.y, p.size, p.size);
        });
    }
}
