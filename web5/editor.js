class MapEditor {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // Editor state
        this.tool = 'add'; // 'add', 'select', 'delete'
        this.selectedWall = null;
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;

        // Wall data
        this.walls = [...mapData]; // Copy the initial map data
        this.nextId = this.walls.length;

        // UI elements
        this.wallTypeSelect = document.getElementById('wallType');
        this.x1Input = document.getElementById('x1');
        this.y1Input = document.getElementById('y1');
        this.x2Input = document.getElementById('x2');
        this.y2Input = document.getElementById('y2');
        this.wallList = document.getElementById('wallList');
        this.status = document.getElementById('status');

        this.setupEventListeners();
        this.updateWallList();
        this.updateUI();
        this.draw();
    }

    setupEventListeners() {
        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleRightClick(e);
        });

        // Tool buttons
        document.getElementById('addWall').addEventListener('click', () => this.setTool('add'));
        document.getElementById('selectWall').addEventListener('click', () => this.setTool('select'));
        document.getElementById('deleteWall').addEventListener('click', () => this.setTool('delete'));

        // Wall property controls
        document.getElementById('updateWall').addEventListener('click', () => this.updateSelectedWall());

        // Action buttons
        document.getElementById('saveMap').addEventListener('click', () => this.saveMap());
        document.getElementById('loadMap').addEventListener('click', () => this.loadMap());
        document.getElementById('clearMap').addEventListener('click', () => this.clearMap());
    }

    setTool(tool) {
        this.tool = tool;
        this.selectedWall = null;
        this.updateUI();
        this.updateWallList();
        this.draw();
    }

    updateUI() {
        // Update tool button states
        document.getElementById('addWall').classList.toggle('active', this.tool === 'add');
        document.getElementById('selectWall').classList.toggle('active', this.tool === 'select');
        document.getElementById('deleteWall').classList.toggle('active', this.tool === 'delete');

        // Update wall properties form
        if (this.selectedWall !== null) {
            const wall = this.walls[this.selectedWall];
            this.wallTypeSelect.value = wall.type;
            this.x1Input.value = wall.x1;
            this.y1Input.value = wall.y1;
            this.x2Input.value = wall.x2;
            this.y2Input.value = wall.y2;
        } else {
            this.wallTypeSelect.value = 'normal';
            this.x1Input.value = '';
            this.y1Input.value = '';
            this.x2Input.value = '';
            this.y2Input.value = '';
        }
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.tool === 'add') {
            this.isDrawing = true;
            this.startX = x;
            this.startY = y;
            this.currentX = x;
            this.currentY = y;
        } else if (this.tool === 'select' || this.tool === 'delete') {
            const wallIndex = this.getWallAt(x, y);
            if (wallIndex !== null) {
                if (this.tool === 'delete') {
                    this.walls.splice(wallIndex, 1);
                    this.selectedWall = null;
                    this.updateWallList();
                    this.updateUI();
                    this.draw();
                } else {
                    this.selectedWall = wallIndex;
                    this.updateUI();
                    this.updateWallList();
                    this.draw();
                }
            } else {
                this.selectedWall = null;
                this.updateUI();
                this.updateWallList();
                this.draw();
            }
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.isDrawing) {
            this.currentX = x;
            this.currentY = y;
            this.draw();
        }
    }

    handleMouseUp(e) {
        if (this.isDrawing) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Create new wall
            const newWall = {
                x1: Math.round(this.startX),
                y1: Math.round(this.startY),
                x2: Math.round(x),
                y2: Math.round(y),
                type: 'normal'
            };

            this.walls.push(newWall);
            this.selectedWall = this.walls.length - 1;
            this.updateWallList();
            this.updateUI();
            this.isDrawing = false;
            this.draw();
        }
    }

    handleRightClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const wallIndex = this.getWallAt(x, y);
        if (wallIndex !== null) {
            this.walls.splice(wallIndex, 1);
            this.selectedWall = null;
            this.updateWallList();
            this.updateUI();
            this.draw();
        }
    }

    getWallAt(x, y) {
        for (let i = this.walls.length - 1; i >= 0; i--) {
            const wall = this.walls[i];
            const dist = this.pointToLineDistance(x, y, wall.x1, wall.y1, wall.x2, wall.y2);
            if (dist < 10) { // 10 pixel tolerance
                return i;
            }
        }
        return null;
    }

    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);

        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (length * length)));
        const closestX = x1 + t * dx;
        const closestY = y1 + t * dy;

        return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
    }

    updateSelectedWall() {
        if (this.selectedWall === null) return;

        const wall = this.walls[this.selectedWall];
        wall.type = this.wallTypeSelect.value;
        wall.x1 = parseInt(this.x1Input.value) || wall.x1;
        wall.y1 = parseInt(this.y1Input.value) || wall.y1;
        wall.x2 = parseInt(this.x2Input.value) || wall.x2;
        wall.y2 = parseInt(this.y2Input.value) || wall.y2;

        this.updateWallList();
        this.draw();
        this.status.textContent = 'Wall updated';
    }

    updateWallList() {
        this.wallList.innerHTML = '';
        this.walls.forEach((wall, index) => {
            const item = document.createElement('div');
            item.className = 'wall-item' + (index === this.selectedWall ? ' selected' : '');
            item.textContent = `${wall.type}: (${wall.x1}, ${wall.y1}) → (${wall.x2}, ${wall.y2})`;
            item.addEventListener('click', () => {
                this.selectedWall = index;
                this.updateUI();
                this.updateWallList();
                this.draw();
            });
            this.wallList.appendChild(item);
        });
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw grid
        this.ctx.strokeStyle = '#e9ecef';
        this.ctx.lineWidth = 1;
        for (let x = 0; x < this.width; x += 10) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.height; y += 10) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }

        // Draw walls
        this.walls.forEach((wall, index) => {
            this.ctx.strokeStyle = this.getWallColor(wall.type);
            this.ctx.lineWidth = index === this.selectedWall ? 4 : 2;
            this.ctx.beginPath();
            this.ctx.moveTo(wall.x1, wall.y1);
            this.ctx.lineTo(wall.x2, wall.y2);
            this.ctx.stroke();

            // Draw wall endpoints
            if (index === this.selectedWall) {
                this.ctx.fillStyle = '#007bff';
                this.ctx.beginPath();
                this.ctx.arc(wall.x1, wall.y1, 4, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(wall.x2, wall.y2, 4, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        // Draw current drawing line
        if (this.isDrawing) {
            this.ctx.strokeStyle = '#28a745';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(this.startX, this.startY);
            this.ctx.lineTo(this.currentX, this.currentY);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }

    getWallColor(type) {
        switch (type) {
            case 'stopping': return '#ffff00';
            case 'door': return '#0000ff';
            default: return '#00ff00';
        }
    }

    saveMap() {
        const dataStr = 'const mapData = ' + JSON.stringify(this.walls, null, 4) + ';';
        const blob = new Blob([dataStr], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'map.js';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.status.textContent = 'Map saved as map.js';
    }

    loadMap() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.js';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        // Extract mapData from the file content
                        const content = event.target.result;
                        const start = content.indexOf('[');
                        const end = content.lastIndexOf(']') + 1;
                        const jsonStr = content.substring(start, end);
                        this.walls = JSON.parse(jsonStr);
                        this.selectedWall = null;
                        this.updateWallList();
                        this.updateUI();
                        this.draw();
                        this.status.textContent = 'Map loaded successfully';
                    } catch (error) {
                        this.status.textContent = 'Error loading map: ' + error.message;
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    clearMap() {
        if (confirm('Are you sure you want to clear all walls?')) {
            this.walls = [];
            this.selectedWall = null;
            this.updateWallList();
            this.updateUI();
            this.draw();
            this.status.textContent = 'Map cleared';
        }
    }
}

// Initialize the editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MapEditor('editorCanvas');
});
