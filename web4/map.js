const mapData = [
    // Main room boundaries (closed, centered around spawn 3600,3600)
    { x1: 3400, y1: 3400, x2: 3550, y2: 3400, type: "normal" },
    { x1: 3650, y1: 3400, x2: 3800, y2: 3400, type: "normal" },
    { x1: 3550, y1: 3400, x2: 3650, y2: 3400, type: "door" },

    { x1: 3800, y1: 3400, x2: 3800, y2: 3800, type: "normal" },
    { x1: 3800, y1: 3800, x2: 3400, y2: 3800, type: "normal" },
    { x1: 3400, y1: 3800, x2: 3400, y2: 3400, type: "normal" },

    // Inner walls forming closed small rooms / obstacles
    { x1: 3550, y1: 3550, x2: 3550, y2: 3650, type: "door" },
    { x1: 3550, y1: 3650, x2: 3650, y2: 3650, type: "door" },
    { x1: 3650, y1: 3650, x2: 3650, y2: 3550, type: "door" },
    { x1: 3550, y1: 3550, x2: 3650, y2: 3550, type: "door" },

    // Doors (openings in walls)

    //{ x1: 3800, y1: 3550, x2: 3800, y2: 3650, type: "door" },

    // Additional small obstacles
    { x1: 3450, y1: 3450, x2: 3470, y2: 3470, type: "stopping" },
    { x1: 3470, y1: 3450, x2: 3470, y2: 3470, type: "stopping" },
    { x1: 3730, y1: 3730, x2: 3750, y2: 3750, type: "stopping" },
    { x1: 3710, y1: 3470, x2: 3730, y2: 3490, type: "stopping" },
    { x1: 3470, y1: 3730, x2: 3490, y2: 3750, type: "stopping" },

    // New obstacles for more complexity
    { x1: 3600, y1: 3500, x2: 3620, y2: 3520, type: "stopping" },
    { x1: 3680, y1: 3680, x2: 3700, y2: 3700, type: "stopping" },
    { x1: 3500, y1: 3700, x2: 3520, y2: 3720, type: "stopping" },
    { x1: 3720, y1: 3500, x2: 3740, y2: 3520, type: "stopping" },

    // world borders
    { x1: 0, y1: 0, x2: 5000, y2: 0, type: "normal" },
    { x1: 5000, y1: 0, x2: 5000, y2: 5000, type: "normal" },
    { x1: 5000, y1: 5000, x2: 0, y2: 5000, type: "normal" },
    { x1: 0, y1: 5000, x2: 0, y2: 0, type: "normal" }
];
