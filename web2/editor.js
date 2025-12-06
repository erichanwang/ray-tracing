class MapEditor {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.walls = mapData.map(wall => ({...wall})); // Deep copy
        this.selectedWall = null;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };

        this.setupEventListeners();
        this.draw();
    }

    setupEventListeners() {
        this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this));
        this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
        this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this));
        document.getElementById("saveMap").addEventListener("click", this.saveMap.bind(this));
    }

    handleMouseDown(e) {
        const mouseX = e.offsetX;
        const mouseY = e.offsetY;

        // Check if a wall is clicked
        this.selectedWall = this.getWallAt(mouseX, mouseY);

        if (this.selectedWall) {
            this.isDragging = true;
            this.dragStart.x = mouseX;
            this.dragStart.y = mouseY;
        } else {
            // Start drawing a new wall
            this.isDragging = true;
            this.dragStart.x = mouseX;
            this.dragStart.y = mouseY;
            this.walls.push({ x1: mouseX, y1: mouseY, x2: mouseX, y2: mouseY });
            this.selectedWall = this.walls[this.walls.length - 1];
        }
    }

    handleMouseMove(e) {
        if (!this.isDragging) return;
        const mouseX = e.offsetX;
        const mouseY = e.offsetY;

        if (this.selectedWall) {
            const dx = mouseX - this.dragStart.x;
            const dy = mouseY - this.dragStart.y;

            if (e.shiftKey) { // Move the entire wall
                this.selectedWall.x1 += dx;
                this.selectedWall.y1 += dy;
                this.selectedWall.x2 += dx;
                this.selectedWall.y2 += dy;
            } else { // Resize the wall
                this.selectedWall.x2 = mouseX;
                this.selectedWall.y2 = mouseY;
            }

            this.dragStart.x = mouseX;
            this.dragStart.y = mouseY;
        }
        this.draw();
    }

    handleMouseUp(e) {
        this.isDragging = false;
    }

    getWallAt(x, y) {
        for (const wall of this.walls) {
            const dist = this.pointToSegmentDistance(x, y, wall.x1, wall.y1, wall.x2, wall.y2);
            if (dist < 5) {
                return wall;
            }
        }
        return null;
    }

    pointToSegmentDistance(px, py, x1, y1, x2, y2) {
        const l2 = (x1 - x2) ** 2 + (y1 - y2) ** 2;
        if (l2 === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
        let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
        t = Math.max(0, Math.min(1, t));
        const dx = x1 + t * (x2 - x1);
        const dy = y1 + t * (y2 - y1);
        return Math.sqrt((px - dx) ** 2 + (py - dy) ** 2);
    }

    draw() {
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.width, this.height);

        for (const wall of this.walls) {
            this.ctx.strokeStyle = "green";
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.moveTo(wall.x1, wall.y1);
            this.ctx.lineTo(wall.x2, wall.y2);
            this.ctx.stroke();

            if (wall === this.selectedWall) {
                this.ctx.fillStyle = "red";
                this.ctx.beginPath();
                this.ctx.arc(wall.x1, wall.y1, 5, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(wall.x2, wall.y2, 5, 0, 2 * Math.PI);
                this.ctx.fill();
            }
        }
    }

    saveMap() {
        const mapDataString = "const mapData = " + JSON.stringify(this.walls, null, 4) + ";";
        const output = document.createElement("textarea");
        output.value = mapDataString;
        document.body.appendChild(output);
        output.select();
        document.execCommand("copy");
        document.body.removeChild(output);
        alert("Map data copied to clipboard!");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const editorCanvas = document.getElementById("editorCanvas");
    if (editorCanvas) {
        new MapEditor("editorCanvas");
    }
});
