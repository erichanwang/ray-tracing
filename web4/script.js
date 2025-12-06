// Ray Tracing - Web Version
// Interactive lighting system with ray casting

class Player {
    constructor(x, y, radius = 3) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speed = 3;
    }

    update(keys, walls, width, height, camera) {
        if (!camera) {
            console.error('Camera is undefined in Player.update');
            return;
        }
        // Player stays centered - movement controls camera instead
        let deltaX = 0;
        let deltaY = 0;

        if (keys['ArrowUp'] || keys['w'] || keys['W']) deltaY -= this.speed;
        if (keys['ArrowDown'] || keys['s'] || keys['S']) deltaY += this.speed;
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) deltaX -= this.speed;
        if (keys['ArrowRight'] || keys['d'] || keys['D']) deltaX += this.speed;

        // Calculate new camera position
        const newCameraX = camera.x + deltaX;
        const newCameraY = camera.y + deltaY;

        // Check collision with walls at new position
        let canMove = true;
        const playerWorldX = newCameraX + this.x;
        const playerWorldY = newCameraY + this.y;

        for (let wall of walls) {
            if (!wall.isSolid()) continue;

            // Simple circle-line collision detection
            const dx = wall.x2 - wall.x1;
            const dy = wall.y2 - wall.y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            const ux = dx / length;
            const uy = dy / length;

            const t = ((playerWorldX - wall.x1) * ux + (playerWorldY - wall.y1) * uy) / length;
            const clampedT = Math.max(0, Math.min(1, t));
            const closestX = wall.x1 + clampedT * dx;
            const closestY = wall.y1 + clampedT * dy;

            const distance = Math.sqrt((playerWorldX - closestX) ** 2 + (playerWorldY - closestY) ** 2);
            if (distance < this.radius) {
                canMove = false;
                break;
            }
        }

        if (canMove) {
            camera.x = newCameraX;
            camera.y = newCameraY;
        }
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

class Tile {
    constructor(x, y, size = 50) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = Math.random() > 0.5 ? '#8B4513' : '#A0522D'; // Brown variations
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.size, this.size);
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
    constructor(x, y, angle, maxLength = 20) {
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
        if (!this.canvas) {
            console.error('Canvas element not found!');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        console.log('Canvas context:', this.ctx);
        if (!this.ctx) {
            console.error('Failed to get canvas context!');
            return;
        }
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        console.log('Canvas size:', this.width, this.height);

        // Camera properties - now controls world movement (initialize first)
        this.camera = {
            x: 3600 - (this.width || 1200) / 2, // Center on scaled map center
            y: 3600 - (this.height || 800) / 2,
            zoom: 1, // No zoom to prevent distortion
            followPlayer: false // Camera moves instead of following
        };

        // Player stays centered on screen
        this.player = new Player(this.width / 2, this.height / 2, 8); // Increased radius from 3 to 8
        this.numRays = 360;
        this.rays = this.createRays(this.numRays);
        this.lightsOn = false;
        this.raysVisible = false;
        this.keys = {};

        console.log('MapData:', mapData);
        this.walls = mapData.map(wall => new Wall(wall.x1, wall.y1, wall.x2, wall.y2, wall.type));
        console.log('Walls created:', this.walls.length);

        // Generate ground tiles
        this.tiles = [];
        for (let x = 0; x < 5000; x += 50) {
            for (let y = 0; y < 5000; y += 50) {
                this.tiles.push(new Tile(x, y));
            }
        }
        console.log('Tiles created:', this.tiles.length);

        this.setupEventListeners();
        this.updateButtonTexts();
        this.gameLoop();
    }

    createRays(numRays) {
        const rays = [];
        const angleStep = (2 * Math.PI) / numRays;
        for (let i = 0; i < numRays; i++) {
            const angle = i * angleStep;
            // Rays start from player's world position (camera + screen center)
            const cameraX = this.camera ? this.camera.x : 0;
            const cameraY = this.camera ? this.camera.y : 0;
            const playerX = this.player ? this.player.x : this.width / 2;
            const playerY = this.player ? this.player.y : this.height / 2;
            const worldX = cameraX + playerX;
            const worldY = cameraY + playerY;
            rays.push(new Ray(worldX, worldY, angle));
        }
        return rays;
    }

    updateRays() {
        for (let i = 0; i < this.rays.length; i++) {
            const angle = (i / this.rays.length) * 2 * Math.PI;
            // Update rays from player's world position
            const cameraX = this.camera ? this.camera.x : 0;
            const cameraY = this.camera ? this.camera.y : 0;
            const playerX = this.player ? this.player.x : this.width / 2;
            const playerY = this.player ? this.player.y : this.height / 2;
            const worldX = cameraX + playerX;
            const worldY = cameraY + playerY;
            this.rays[i].update(worldX, worldY, angle);
            this.rays[i].cast(this.walls);
        }
    }

    updateCamera() {
        if (this.camera.followPlayer) {
            // Keep player centered on screen
            this.camera.x = this.player.x - this.width / 2;
            this.camera.y = this.player.y - this.height / 2;
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

    updateButtonTexts() {
        const lightsBtn = document.getElementById('toggleLights');
        lightsBtn.textContent = this.lightsOn ? 'Lights: ON' : 'Lights: OFF';
        lightsBtn.classList.toggle('off', !this.lightsOn);

        const raysBtn = document.getElementById('toggleRays');
        raysBtn.textContent = this.raysVisible ? 'Rays: ON' : 'Rays: OFF';
        raysBtn.classList.toggle('off', !this.raysVisible);

        document.getElementById('rayCount').textContent = this.numRays;
    }

    draw() {
        // Fill with black background for unseen areas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Apply camera transformation
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);

        if (this.lightsOn) {
            // Draw ground tiles
            for (let tile of this.tiles) {
                tile.draw(this.ctx);
            }

            // Draw all walls
            for (let wall of this.walls) {
                wall.draw(this.ctx);
            }

            // Draw rays
            for (let ray of this.rays) {
                ray.draw(this.ctx);
            }

            // Draw player at world position
            this.ctx.fillStyle = '#ffff00';
            this.ctx.beginPath();
            this.ctx.arc(this.camera.x + this.width / 2, this.camera.y + this.height / 2, this.player.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = '#00d4ff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        } else {
            this.drawLitScene();
        }

        this.ctx.restore();
    }

    drawLitScene() {
        // Only draw tiles that are directly illuminated by rays
        const illuminatedTiles = new Set();
        for (let ray of this.rays) {
            // Check tiles near the ray end point
            const tileSize = 50;
            const tileX = Math.floor(ray.endX / tileSize) * tileSize;
            const tileY = Math.floor(ray.endY / tileSize) * tileSize;
            for (let tile of this.tiles) {
                if (tile.x === tileX && tile.y === tileY) {
                    illuminatedTiles.add(tile);
                    break;
                }
            }
        }

        // Draw illuminated tiles
        for (let tile of illuminatedTiles) {
            tile.draw(this.ctx);
        }

        // Only draw walls that are directly illuminated by rays (player cannot see behind walls)
        const illuminatedWalls = new Set();
        for (let ray of this.rays) {
            if (ray.hitWall) {
                illuminatedWalls.add(ray.hitWall);
            }
        }

        // Draw only illuminated walls - no full wall visibility for partial illumination
        for (let wall of illuminatedWalls) {
            wall.draw(this.ctx);
        }

        if (this.raysVisible) {
            for (let ray of this.rays) {
                ray.drawLit(this.ctx);
            }
        }

        // Draw player at world position
        const playerWorldX = this.camera.x + this.width / 2;
        const playerWorldY = this.camera.y + this.height / 2;
        this.ctx.fillStyle = '#ffff00';
        this.ctx.beginPath();
        this.ctx.arc(playerWorldX, playerWorldY, this.player.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#00d4ff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
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
        // Check if player is near a door (using world coordinates)
        const playerWorldX = this.camera.x + this.player.x;
        const playerWorldY = this.camera.y + this.player.y;

        for (let wall of this.walls) {
            if (wall.type === "door") {
                const dx = wall.x1 - playerWorldX;
                const dy = wall.y1 - playerWorldY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 50) { // Interaction distance
                    wall.open = !wall.open;
                    break;
                }
            }
        }
    }

    update() {
        this.player.update(this.keys, this.walls, this.width, this.height, this.camera);
        this.updateRays();
        this.updateCamera();
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating game');
    window.gameInstance = new Game('gameCanvas');
});
