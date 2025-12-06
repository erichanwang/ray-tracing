// Ray Tracing - Web Version
// Interactive lighting system with ray casting

class Player {
    constructor(x, y, radius = 8) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speed = 5;
    }

    update(keys) {
        if (keys['ArrowUp'] || keys['w'] || keys['W']) this.y -= this.speed;
        if (keys['ArrowDown'] || keys['s'] || keys['S']) this.y += this.speed;
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) this.x -= this.speed;
        if (keys['ArrowRight'] || keys['d'] || keys['D']) this.x += this.speed;

        this.x = Math.max(this.radius, Math.min(1024 - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(768 - this.radius, this.y));
    }

    draw(ctx) {
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class Wall {
    constructor(x1, y1, x2, y2, type = "normal") {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.type = type;
        this.color = this.type === "stopping" ? "#ffff00" : "#00ff00";
    }

    draw(ctx) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.stroke();
    }

    getIntersection(rayX, rayY, rayDx, rayDy, maxDistance = 500) {
        const x1 = this.x1, y1 = this.y1;
        const x2 = this.x2, y2 = this.y2;

        const denom = (x2 - x1) * (-rayDy) - (y2 - y1) * (-rayDx);

        if (Math.abs(denom) < 1e-10) return null;

        const t = ((x1 - rayX) * (-rayDy) - (y1 - rayY) * (-rayDx)) / denom;
        const s = ((x1 - rayX) * (y2 - y1) - (y1 - rayY) * (x2 - x1)) / denom;

        const rayLength = Math.sqrt(rayDx * rayDx + rayDy * rayDy);
        if (0 < s && s < 1 && 0 < t && t < maxDistance / rayLength) {
            const intX = rayX + t * rayDx;
            const intY = rayY + t * rayDy;
            const distance = Math.sqrt((intX - rayX) ** 2 + (intY - rayY) ** 2);
            return { x: intX, y: intY, distance };
        }

        return null;
    }
}

class Ray {
    constructor(x, y, angle, maxLength = 500) {
        this.startX = x;
        this.startY = y;
        this.angle = angle;
        this.maxLength = maxLength;
        this.endX = x + maxLength * Math.cos(angle);
        this.endY = y + maxLength * Math.sin(angle);
        this.hitDistance = maxLength;
    }

    update(x, y, angle) {
        this.startX = x;
        this.startY = y;
        this.angle = angle;
        this.hitDistance = this.maxLength;
        this.endX = x + this.maxLength * Math.cos(angle);
        this.endY = y + this.maxLength * Math.sin(angle);
    }

    cast(walls) {
        const rayDx = Math.cos(this.angle);
        const rayDy = Math.sin(this.angle);

        let closestDistance = this.maxLength;
        let closestPoint = { x: this.endX, y: this.endY };

        for (let wall of walls) {
            const intersection = wall.getIntersection(
                this.startX,
                this.startY,
                rayDx,
                rayDy,
                this.maxLength
            );

            if (intersection && intersection.distance < closestDistance) {
                if (wall.type === "stopping") {
                    closestDistance = intersection.distance;
                    closestPoint = { x: intersection.x, y: intersection.y };
                }
            }
        }

        this.hitDistance = closestDistance;
        this.endX = closestPoint.x;
        this.endY = closestPoint.y;
    }

    draw(ctx) {
        const intensity = Math.floor(255 * (1 - this.hitDistance / this.maxLength));
        const r = Math.max(255, intensity);
        const g = Math.max(0, 200 - intensity);
        const b = 0;
        ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(this.endX, this.endY);
        ctx.stroke();
    }

    drawLit(ctx) {
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(this.endX, this.endY);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
}

class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.player = new Player(this.width / 2, this.height / 2);
        this.numRays = 10;
        this.rays = this.createRays(this.numRays);
        this.lightsOn = true;
        this.keys = {};

        this.walls = mapData.map(wall => new Wall(wall.x1, wall.y1, wall.x2, wall.y2, wall.type));

        this.setupEventListeners();
        this.gameLoop();
    }

    createRays(numRays) {
        const rays = [];
        const angleStep = (2 * Math.PI) / numRays;
        for (let i = 0; i < numRays; i++) {
            const angle = i * angleStep;
            rays.push(new Ray(this.player.x, this.player.y, angle));
        }
        return rays;
    }

    updateRays() {
        for (let i = 0; i < this.rays.length; i++) {
            const angle = (i / this.rays.length) * 2 * Math.PI;
            this.rays[i].update(this.player.x, this.player.y, angle);
            this.rays[i].cast(this.walls);
        }
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        document.getElementById('toggleLights').addEventListener('click', () => {
            this.lightsOn = !this.lightsOn;
            const btn = document.getElementById('toggleLights');
            btn.textContent = this.lightsOn ? 'Lights: ON' : 'Lights: OFF';
            btn.classList.toggle('off');
        });

        document.getElementById('addRays').addEventListener('click', () => {
            this.numRays = Math.min(360, this.numRays + 5);
            this.rays = this.createRays(this.numRays);
            document.getElementById('rayCount').textContent = this.numRays;
        });

        document.getElementById('removeRays').addEventListener('click', () => {
            this.numRays = Math.max(1, this.numRays - 5);
            this.rays = this.createRays(this.numRays);
            document.getElementById('rayCount').textContent = this.numRays;
        });
    }

    draw() {
        this.ctx.fillStyle = this.lightsOn ? '#000000' : '#ffffff';
        this.ctx.fillRect(0, 0, this.width, this.height);

        if (this.lightsOn) {
            for (let wall of this.walls) {
                wall.draw(this.ctx);
            }

            for (let ray of this.rays) {
                ray.draw(this.ctx);
            }

            this.player.draw(this.ctx);
        } else {
            this.drawLitScene();
        }
    }

    drawLitScene() {
        for (let wall of this.walls) {
            if (this.isWallIlluminated(wall)) {
                wall.draw(this.ctx);
            }
        }

        for (let ray of this.rays) {
            ray.drawLit(this.ctx);
        }

        this.player.draw(this.ctx);
    }

    isWallIlluminated(wall) {
        for (let ray of this.rays) {
            const dx = ray.endX - ray.startX;
            const dy = ray.endY - ray.startY;
            
            const d1 = Math.sqrt((wall.x1 - ray.endX) ** 2 + (wall.y1 - ray.endY) ** 2);
            const d2 = Math.sqrt((wall.x2 - ray.endX) ** 2 + (wall.y2 - ray.endY) ** 2);
            
            if (d1 < 30 || d2 < 30) return true;
        }
        return false;
    }

    update() {
        this.player.update(this.keys);
        this.updateRays();
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Game('gameCanvas');
});
