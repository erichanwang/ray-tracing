// Ray Tracing - Web Version (fixed + improved)
// Interactive lighting system with ray casting
// Changes: default ray length increased, intensity math fixed, consistent world coords,
// createRays preserves ray length, smaller tilemap for performance, other small fixes.

class Player {
    constructor(x, y, radius = 20) {
        // x,y are screen-centered coordinates (usually canvas center)
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speed = 10;
    }

    update(keys, walls, width, height, camera) {
        if (!camera) {
            console.error('Camera is undefined in Player.update');
            return;
        }

        let deltaX = 0;
        let deltaY = 0;

        if (keys['ArrowUp'] || keys['w'] || keys['W']) deltaY -= this.speed;
        if (keys['ArrowDown'] || keys['s'] || keys['S']) deltaY += this.speed;
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) deltaX -= this.speed;
        if (keys['ArrowRight'] || keys['d'] || keys['D']) deltaX += this.speed;

        // Camera moves; player stays visually centered
        const newCameraX = camera.x + deltaX;
        const newCameraY = camera.y + deltaY;

        // Check collision using the player's world position at the new camera
        const playerWorldX = newCameraX + this.x;
        const playerWorldY = newCameraY + this.y;

        let canMove = true;

        for (let wall of walls) {
            if (!wall.isSolid()) continue;

            const coords = wall.getEffectiveCoords();

            // circle (player) - segment (wall) distance
            const dx = coords.x2 - coords.x1;
            const dy = coords.y2 - coords.y1;
            const segLenSq = dx * dx + dy * dy;
            if (segLenSq === 0) continue;

            // projection t of point onto segment (0..1)
            const t = ((playerWorldX - coords.x1) * dx + (playerWorldY - coords.y1) * dy) / segLenSq;
            const clampedT = Math.max(0, Math.min(1, t));
            const closestX = coords.x1 + clampedT * dx;
            const closestY = coords.y1 + clampedT * dy;

            const distance = Math.hypot(playerWorldX - closestX, playerWorldY - closestY);
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

    // draw expects the canvas to be in world coordinate space (i.e., after translate(-camera.x, -camera.y))
    draw(ctx, worldX, worldY) {
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(worldX, worldY, this.radius, 0, Math.PI * 2);
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
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
        ctx.beginPath();

        // If door is open, draw using computed effective coords so visuals match collision/lighting
        const coords = this.getEffectiveCoords();
        ctx.moveTo(coords.x1, coords.y1);
        ctx.lineTo(coords.x2, coords.y2);
        ctx.stroke();
    }

    isSolid() {
        return this.type !== "door" || !this.open;
    }

    getEffectiveCoords() {
        // If door open, rotate 90 degrees around the midpoint (keeps consistent visuals + math)
        if (this.type === "door" && this.open) {
            const centerX = (this.x1 + this.x2) / 2;
            const centerY = (this.y1 + this.y2) / 2;
            const angle = Math.PI / 2; // 90 degrees
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);

            const relX1 = this.x1 - centerX;
            const relY1 = this.y1 - centerY;
            const relX2 = this.x2 - centerX;
            const relY2 = this.y2 - centerY;

            const rotX1 = relX1 * cos - relY1 * sin + centerX;
            const rotY1 = relX1 * sin + relY1 * cos + centerY;
            const rotX2 = relX2 * cos - relY2 * sin + centerX;
            const rotY2 = relX2 * sin + relY2 * cos + centerY;

            return { x1: rotX1, y1: rotY1, x2: rotX2, y2: rotY2 };
        }

        return { x1: this.x1, y1: this.y1, x2: this.x2, y2: this.y2 };
    }

    getIntersection(rayX, rayY, rayDx, rayDy, maxDistance = 800) {
        const coords = this.getEffectiveCoords();
        const x1 = coords.x1, y1 = coords.y1;
        const x2 = coords.x2, y2 = coords.y2;

        const dx = x2 - x1;
        const dy = y2 - y1;

        const denom = rayDx * dy - rayDy * dx;
        if (Math.abs(denom) < 1e-10) return null;

        const t = ((x1 - rayX) * dy - (y1 - rayY) * dx) / denom;
        const s = ((x1 - rayX) * rayDy - (y1 - rayY) * rayDx) / denom;

        if (t > 0 && 0 <= s && s <= 1) {
            const intX = rayX + t * rayDx;
            const intY = rayY + t * rayDy;
            const distance = Math.hypot(intX - rayX, intY - rayY);
            if (distance <= maxDistance) {
                return { x: intX, y: intY, distance };
            }
        }

        return null;
    }
}

class Ray {
    constructor(x, y, angle, maxLength = 300) {
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
        // keep hitDistance consistent with maxLength until cast()
        this.hitDistance = this.maxLength;
        this.endX = x + this.maxLength * Math.cos(angle);
        this.endY = y + this.maxLength * Math.sin(angle);
        this.hitWall = null;
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
        // Intensity: 0..255 where nearer = higher intensity
        const intensity = Math.floor(255 * (1 - (this.hitDistance / this.maxLength)));
        // clamp
        const clamped = Math.max(0, Math.min(255, intensity));

        // Make a warm color where nearer rays are brighter
        const r = 255; // keep red high for a warm look
        const g = Math.max(0, 200 - clamped);
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

        // Set resolution if desired (match CSS size)
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        console.log('Canvas size:', this.width, this.height);

        // Camera - controls world offset (worldX = camera.x + player.x)
        this.camera = {
            x: 3600 - (this.width || 1200) / 2,
            y: 3600 - (this.height || 800) / 2,
            zoom: 1,
            followPlayer: false
        };

        // Player is screen-centered, so set to center coordinates
        this.player = new Player(this.width / 2, this.height / 2, 20);

        // Ray settings
        this.numRays = 100;
        this.defaultRayLength = 300; // <-- default ray length (longer by default)
        this.rays = this.createRays(this.numRays);
        this.lightsOn = false;     // full lights = draw everything
        this.raysVisible = false;  // draw lit ray lines when in dark mode
        this.keys = {};

        // Map/walls (external `mapData` expected)
        console.log('MapData:', typeof mapData !== 'undefined' ? mapData : 'undefined');
        this.walls = (typeof mapData !== 'undefined' ? mapData : []).map(
            w => new Wall(w.x1, w.y1, w.x2, w.y2, w.type)
        );
        console.log('Walls created:', this.walls.length);

        // Tile generation - reduced map size to avoid creating millions of tiles
        this.tiles = [];
        // small world settings (adjust as needed)
        const mapWidth = 2000;   // world width in px
        const mapHeight = 2000;  // world height in px
        const tileSize = 25;

        for (let x = 0; x < mapWidth; x += tileSize) {
            for (let y = 0; y < mapHeight; y += tileSize) {
                this.tiles.push(new Tile(x, y, tileSize));
            }
        }
        console.log('Tiles created:', this.tiles.length);

        this.setupEventListeners();
        this.updateButtonTexts();
        this.gameLoop();
    }

    createRays(numRays) {
        const rays = [];
        const angleStep = (2 * Math.PI) / Math.max(1, numRays);
        for (let i = 0; i < numRays; i++) {
            const angle = i * angleStep;
            // start from player's world position
            const cameraX = this.camera ? this.camera.x : 0;
            const cameraY = this.camera ? this.camera.y : 0;
            const playerX = this.player ? this.player.x : this.width / 2;
            const playerY = this.player ? this.player.y : this.height / 2;
            const worldX = cameraX + playerX;
            const worldY = cameraY + playerY;
            rays.push(new Ray(worldX, worldY, angle, this.defaultRayLength));
        }
        return rays;
    }

    updateRays() {
        for (let i = 0; i < this.rays.length; i++) {
            const angle = (i / this.rays.length) * 2 * Math.PI;
            const cameraX = this.camera ? this.camera.x : 0;
            const cameraY = this.camera ? this.camera.y : 0;
            const playerX = this.player ? this.player.x : this.width / 2;
            const playerY = this.player ? this.player.y : this.height / 2;
            const worldX = cameraX + playerX;
            const worldY = cameraY + playerY;

            // Update ray start/angle and ensure each ray uses the current maxLength
            this.rays[i].maxLength = this.rays[i].maxLength || this.defaultRayLength;
            this.rays[i].update(worldX, worldY, angle);
            this.rays[i].cast(this.walls);
        }
    }

    updateCamera() {
        if (this.camera.followPlayer) {
            // If followPlayer true, we want camera so player appears centered
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

        // Buttons expected to exist in DOM
        const toggleLightsBtn = document.getElementById('toggleLights');
        if (toggleLightsBtn) {
            toggleLightsBtn.addEventListener('click', () => {
                this.lightsOn = !this.lightsOn;
                toggleLightsBtn.textContent = this.lightsOn ? 'Lights: ON' : 'Lights: OFF';
                toggleLightsBtn.classList.toggle('off');
            });
        }

        const toggleRaysBtn = document.getElementById('toggleRays');
        if (toggleRaysBtn) {
            toggleRaysBtn.addEventListener('click', () => {
                this.raysVisible = !this.raysVisible;
                toggleRaysBtn.textContent = this.raysVisible ? 'Rays: ON' : 'Rays: OFF';
                toggleRaysBtn.classList.toggle('off');
            });
        }

        const addRaysBtn = document.getElementById('addRays');
        if (addRaysBtn) {
            addRaysBtn.addEventListener('click', () => {
                this.numRays = Math.min(3600, this.numRays + 30);
                // recreate rays preserving the intended defaultRayLength
                this.rays = this.createRays(this.numRays);
                const rc = document.getElementById('rayCount');
                if (rc) rc.textContent = this.numRays;
            });
        }

        const removeRaysBtn = document.getElementById('removeRays');
        if (removeRaysBtn) {
            removeRaysBtn.addEventListener('click', () => {
                this.numRays = Math.max(1, this.numRays - 5);
                this.rays = this.createRays(this.numRays);
                const rc = document.getElementById('rayCount');
                if (rc) rc.textContent = this.numRays;
            });
        }

        const increaseRadiusBtn = document.getElementById('increaseRadius');
        if (increaseRadiusBtn) {
            increaseRadiusBtn.addEventListener('click', () => {
                for (let ray of this.rays) {
                    ray.maxLength = Math.min(2000, (ray.maxLength || this.defaultRayLength) + 50);
                }
            });
        }

        const decreaseRadiusBtn = document.getElementById('decreaseRadius');
        if (decreaseRadiusBtn) {
            decreaseRadiusBtn.addEventListener('click', () => {
                for (let ray of this.rays) {
                    ray.maxLength = Math.max(50, (ray.maxLength || this.defaultRayLength) - 50);
                }
            });
        }
    }

    updateButtonTexts() {
        const lightsBtn = document.getElementById('toggleLights');
        if (lightsBtn) {
            lightsBtn.textContent = this.lightsOn ? 'Lights: ON' : 'Lights: OFF';
            lightsBtn.classList.toggle('off', !this.lightsOn);
        }

        const raysBtn = document.getElementById('toggleRays');
        if (raysBtn) {
            raysBtn.textContent = this.raysVisible ? 'Rays: ON' : 'Rays: OFF';
            raysBtn.classList.toggle('off', !this.raysVisible);
        }

        const rc = document.getElementById('rayCount');
        if (rc) rc.textContent = this.numRays;
    }

    draw() {
        // Fill screen black
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Apply camera: shift world so camera.x/camera.y are the offsets
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);

        if (this.lightsOn) {
            // Draw ground tiles (full light)
            for (let tile of this.tiles) tile.draw(this.ctx);

            // Draw all walls
            for (let wall of this.walls) wall.draw(this.ctx);

            // Draw rays (for debugging)
            for (let ray of this.rays) ray.draw(this.ctx);

            // Draw player as world object (world coords)
            const worldPlayerX = this.camera.x + this.player.x;
            const worldPlayerY = this.camera.y + this.player.y;
            this.player.draw(this.ctx, worldPlayerX, worldPlayerY);
        } else {
            // Dark environment: draw lit scene only
            this.drawLitScene();
        }

        this.ctx.restore();
    }

    drawLitScene() {
        // Find illuminated tiles by sampling along each ray
        const illuminatedTiles = new Set();
        const tileSize = 25;

        const playerWorldX = this.camera.x + this.player.x;
        const playerWorldY = this.camera.y + this.player.y;
        const playerTileX = Math.floor(playerWorldX / tileSize) * tileSize;
        const playerTileY = Math.floor(playerWorldY / tileSize) * tileSize;

        // add player's tile
        for (let tile of this.tiles) {
            if (tile.x === playerTileX && tile.y === playerTileY) {
                illuminatedTiles.add(tile);
                break;
            }
        }

        for (let ray of this.rays) {
            // Steps along the ray - sample positions between start and end
            const steps = Math.max(1, Math.ceil(ray.hitDistance / tileSize));
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const sampleX = ray.startX + t * (ray.endX - ray.startX);
                const sampleY = ray.startY + t * (ray.endY - ray.startY);
                const tileX = Math.floor(sampleX / tileSize) * tileSize;
                const tileY = Math.floor(sampleY / tileSize) * tileSize;

                // fast lookup: iterate tiles (ok for modest tile count)
                for (let tile of this.tiles) {
                    if (tile.x === tileX && tile.y === tileY) {
                        illuminatedTiles.add(tile);
                        break;
                    }
                }
            }
        }

        // Draw illuminated tiles
        for (let tile of illuminatedTiles) tile.draw(this.ctx);

        // Determine illuminated walls (rays that hit walls)
        const illuminatedWalls = new Set();
        for (let ray of this.rays) {
            if (ray.hitWall) illuminatedWalls.add(ray.hitWall);
        }

        // Draw only illuminated walls (using getEffectiveCoords ensures correct visuals)
        for (let wall of illuminatedWalls) wall.draw(this.ctx);

        // Optionally draw rays overlay for debugging or "visible rays" option
        if (this.raysVisible) {
            for (let ray of this.rays) ray.drawLit(this.ctx);
        }

        // Draw player at world coordinates
        const drawPlayerWorldX = this.camera.x + this.player.x;
        const drawPlayerWorldY = this.camera.y + this.player.y;
        this.player.draw(this.ctx, drawPlayerWorldX, drawPlayerWorldY);
    }

    isWallIlluminated(wall) {
        // Use effective coords for doors and closed/open state
        const coords = wall.getEffectiveCoords();
        for (let ray of this.rays) {
            const d1 = Math.hypot(coords.x1 - ray.endX, coords.y1 - ray.endY);
            const d2 = Math.hypot(coords.x2 - ray.endX, coords.y2 - ray.endY);
            if (d1 < 30 || d2 < 30) return true;
        }
        return false;
    }

    interactWithDoor() {
        const playerWorldX = this.camera.x + this.player.x;
        const playerWorldY = this.camera.y + this.player.y;

        for (let wall of this.walls) {
            if (wall.type === "door") {
                // Use hinge (x1,y1) as interaction point for door toggling
                const dx = wall.x1 - playerWorldX;
                const dy = wall.y1 - playerWorldY;
                const distance = Math.hypot(dx, dy);
                if (distance < 50) {
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

// Create the game on DOM ready (expects elements: gameCanvas and control buttons)
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating game');
    window.gameInstance = new Game('gameCanvas');
});
