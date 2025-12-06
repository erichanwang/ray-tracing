// Ray Tracing - Web Version
// Interactive lighting system with ray casting

class Player {
    constructor(x, y, radius = 3) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speed = 3;
    }

    update(keys, walls, width, height) {
        let newX = this.x;
        let newY = this.y;

        if (keys['ArrowUp'] || keys['w'] || keys['W']) newY -= this.speed;
        if (keys['ArrowDown'] || keys['s'] || keys['S']) newY += this.speed;
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) newX -= this.speed;
        if (keys['ArrowRight'] || keys['d'] || keys['D']) newX += this.speed;

        // Check collision with walls
        let canMove = true;
        for (let wall of walls) {
            if (!wall.isSolid()) continue;

            // Simple circle-line collision detection
            const dx = wall.x2 - wall.x1;
            const dy = wall.y2 - wall.y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            const ux = dx / length;
            const uy = dy / length;

            const t = ((newX - wall.x1) * ux + (newY - wall.y1) * uy) / length;
            const clampedT = Math.max(0, Math.min(1, t));
            const closestX = wall.x1 + clampedT * dx;
            const closestY = wall.y1 + clampedT * dy;

            const distance = Math.sqrt((newX - closestX) ** 2 + (newY - closestY) ** 2);
            if (distance < this.radius) {
                canMove = false;
                break;
            }
        }

        if (canMove) {
            this.x = newX;
            this.y = newY;
        }

        this.x = Math.max(this.radius, Math.min(width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(height - this.radius, this.y));
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
    constructor(x1, y1, x2, y2, type = "normal", open = false) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.type = type;
        this.open = open;
        this.color = this.type === "stopping" ? "#ffff00" : this.type === "door" ? "#0000ff" : "#00ff00";
    }

    draw(ctx) {
        if (this.type === "door" && this.open) return; // Don't draw open doors
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.stroke();
    }

    isSolid() {
        return this.type !== "door" || !this.open;
    }

    getIntersection(rayX, rayY, rayDx, rayDy, maxDistance = 800) {
        const x1 = this.x1, y1 = this.y1;
        const x2 = this.x2, y2 = this.y2;

        const dx = x2 - x1;
        const dy = y2 - y1;

        const denom = rayDx * dy - rayDy * dx;

        if (Math.abs(denom) < 1e-10) return null;

        const t = ((x1 - rayX) * dy - (y1 - rayY) * dx) / denom;
        const s = ((x1 - rayX) * rayDy - (y1 - rayY) * rayDx) / denom;

        if (t > 0 && 0 <= s && s <= 1) {
            const intX = rayX + t * rayDx;
            const intY = rayY + t * rayDy;
            const distance = Math.sqrt((intX - rayX) ** 2 + (intY - rayY) ** 2);
            if (distance <= maxDistance) {
                return { x: intX, y: intY, distance };
            }
        }

        return null;
    }
}

class Ray {
    constructor(x, y, angle, maxLength = 200) {
        this.startX = x;
        this.startY = y;
        this.angle = angle;
        this.maxLength = maxLength;
        this.endX = x + maxLength * Math.cos(angle);
        this.endY = y + maxLength * Math.sin(angle);
        this.hitDistance = maxLength;
        this.hitWall = null;
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
        let hitWall = null;

        for (let wall of walls) {
            const intersection = wall.getIntersection(
                this.startX,
                this.startY,
                rayDx,
                rayDy,
                this.maxLength
            );

            if (intersection && intersection.distance < closestDistance) {
                closestDistance = intersection.distance;
                closestPoint = { x: intersection.x, y: intersection.y };
                hitWall = wall;
            }
        }

        this.hitDistance = closestDistance;
        this.endX = closestPoint.x;
        this.endY = closestPoint.y;
        this.hitWall = hitWall;
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
        console.log('Game constructor called');
        this.canvas = document.getElementById(canvasId);
        console.log('Canvas element:', this.canvas);
        this.ctx = this.canvas.getContext('2d');
        console.log('Canvas context:', this.ctx);
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        console.log('Canvas size:', this.width, this.height);

        this.player = new Player(this.width / 2, this.height / 2);
        this.numRays = 360;
        this.rays = this.createRays(this.numRays);
        this.lightsOn = false;
        this.raysVisible = true;
        this.keys = {};

        console.log('MapData:', mapData);
        this.walls = mapData.map(wall => new Wall(wall.x1, wall.y1, wall.x2, wall.y2, wall.type));
        console.log('Walls created:', this.walls.length);

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
            if (e.key === 'e' || e.key === 'E') {
                this.interactWithDoor();
            }
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

        document.getElementById('toggleRays').addEventListener('click', () => {
            this.raysVisible = !this.raysVisible;
            const btn = document.getElementById('toggleRays');
            btn.textContent = this.raysVisible ? 'Rays: ON' : 'Rays: OFF';
            btn.classList.toggle('off');
        });

        document.getElementById('addRays').addEventListener('click', () => {
            this.numRays = Math.min(3600, this.numRays + 30);
            this.rays = this.createRays(this.numRays);
            document.getElementById('rayCount').textContent = this.numRays;
        });

        document.getElementById('removeRays').addEventListener('click', () => {
            this.numRays = Math.max(1, this.numRays - 5);
            this.rays = this.createRays(this.numRays);
            document.getElementById('rayCount').textContent = this.numRays;
        });

        document.getElementById('increaseRadius').addEventListener('click', () => {
            for (let ray of this.rays) {
                ray.maxLength = Math.min(800, ray.maxLength + 20);
            }
        });

        document.getElementById('decreaseRadius').addEventListener('click', () => {
            for (let ray of this.rays) {
                ray.maxLength = Math.max(50, ray.maxLength - 20);
            }
        });
    }

    draw() {
        // Fill with black background for unseen areas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        if (this.lightsOn) {
            // Draw all walls
            for (let wall of this.walls) {
                wall.draw(this.ctx);
            }

            // Draw rays
            for (let ray of this.rays) {
                ray.draw(this.ctx);
            }

            this.player.draw(this.ctx);
        } else {
            this.drawLitScene();
        }
    }

    drawLitScene() {
        // Group hit points by wall
        const wallHits = new Map();

        for (let ray of this.rays) {
            if (ray.hitWall && !ray.hitWall.open) {
                if (!wallHits.has(ray.hitWall)) {
                    wallHits.set(ray.hitWall, []);
                }
                // Calculate parameter t along the wall
                const dx = ray.hitWall.x2 - ray.hitWall.x1;
                const dy = ray.hitWall.y2 - ray.hitWall.y1;
                const length = Math.sqrt(dx * dx + dy * dy);
                const ux = dx / length;
                const uy = dy / length;
                const t = ((ray.endX - ray.hitWall.x1) * ux + (ray.endY - ray.hitWall.y1) * uy) / length;
                wallHits.get(ray.hitWall).push(t);
            }
        }

        // Draw connected segments for each wall
        for (let [wall, ts] of wallHits) {
            if (ts.length === 0) continue;

            // Sort t values
            ts.sort((a, b) => a - b);

            // Calculate wall length once
            const wallLength = Math.sqrt((wall.x2 - wall.x1) ** 2 + (wall.y2 - wall.y1) ** 2);

            // Merge close t values (within segment length)
            const mergedTs = [];
            const segmentLength = 40; // pixels, increased for better connection
            let currentGroup = [ts[0]];

            for (let i = 1; i < ts.length; i++) {
                const prevT = currentGroup[currentGroup.length - 1];
                const currT = ts[i];
                const pixelDistance = Math.abs(currT - prevT) * wallLength;

                if (pixelDistance <= segmentLength) {
                    currentGroup.push(currT);
                } else {
                    mergedTs.push(currentGroup);
                    currentGroup = [currT];
                }
            }
            mergedTs.push(currentGroup);

            // Draw merged segments
            for (let group of mergedTs) {
                if (group.length === 0) continue;

                const t1 = Math.max(0, Math.min(...group) - segmentLength / (2 * wallLength));
                const t2 = Math.min(1, Math.max(...group) + segmentLength / (2 * wallLength));

                const dx = wall.x2 - wall.x1;
                const dy = wall.y2 - wall.y1;
                const x1 = wall.x1 + t1 * dx;
                const y1 = wall.y1 + t1 * dy;
                const x2 = wall.x1 + t2 * dx;
                const y2 = wall.y1 + t2 * dy;

                this.ctx.strokeStyle = wall.color;
                this.ctx.lineWidth = 4;
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
                this.ctx.stroke();
            }
        }

        if (this.raysVisible) {
            for (let ray of this.rays) {
                ray.drawLit(this.ctx);
            }
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

    interactWithDoor() {
        // Check if player is near a door
        for (let wall of this.walls) {
            if (wall.type === "door") {
                const dx = wall.x1 - this.player.x;
                const dy = wall.y1 - this.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 50) { // Interaction distance
                    wall.open = !wall.open;
                    break;
                }
            }
        }
    }

    update() {
        this.player.update(this.keys, this.walls, this.width, this.height);
        this.updateRays();
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating game');
    new Game('gameCanvas');
});
