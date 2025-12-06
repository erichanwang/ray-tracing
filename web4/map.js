const mapData = [
    // Main room boundaries centered around spawn (3600, 3600)
    {"x1": 3400, "y1": 3400, "x2": 3500, "y2": 3400, "type": "normal"},
    {"x1": 3700, "y1": 3400, "x2": 3800, "y2": 3400, "type": "normal"},
    {"x1": 3800, "y1": 3400, "x2": 3800, "y2": 3500, "type": "normal"},
    {"x1": 3800, "y1": 3700, "x2": 3800, "y2": 3800, "type": "normal"},
    {"x1": 3800, "y1": 3800, "x2": 3400, "y2": 3800, "type": "normal"},
    {"x1": 3400, "y1": 3800, "x2": 3400, "y2": 3400, "type": "normal"},

    // Inner walls and obstacles
    {"x1": 3550, "y1": 3550, "x2": 3550, "y2": 3650, "type": "stopping"},
    {"x1": 3650, "y1": 3550, "x2": 3650, "y2": 3650, "type": "stopping"},
    {"x1": 3550, "y1": 3400, "x2": 3650, "y2": 3400, "type": "door"},
    {"x1": 3800, "y1": 3550, "x2": 3800, "y2": 3650, "type": "door"},

    // Additional obstacles closer together
    {"x1": 3450, "y1": 3450, "x2": 3470, "y2": 3470, "type": "stopping"},
    {"x1": 3730, "y1": 3730, "x2": 3750, "y2": 3750, "type": "stopping"},
    {"x1": 3470, "y1": 3730, "x2": 3490, "y2": 3750, "type": "stopping"},
    {"x1": 3710, "y1": 3470, "x2": 3730, "y2": 3490, "type": "stopping"}
];
