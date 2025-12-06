const mapData = [
    // Scaled walls (multiplied by 0.75)
    { x1: 75, y1: 75, x2: 375, y2: 75, type: "normal" },
    { x1: 375, y1: 75, x2: 375, y2: 300, type: "normal" },
    { x1: 375, y1: 300, x2: 75, y2: 300, type: "normal" },
    { x1: 75, y1: 300, x2: 75, y2: 75, type: "normal" },
    { x1: 150, y1: 150, x2: 300, y2: 225, type: "stopping" },
    { x1: 487.5, y1: 112.5, x2: 675, y2: 150, type: "normal" },
    { x1: 675, y1: 150, x2: 675, y2: 375, type: "stopping" },
    { x1: 675, y1: 375, x2: 487.5, y2: 412.5, type: "normal" },
    { x1: 112.5, y1: 450, x2: 262.5, y2: 487.5, type: "stopping" },
    { x1: 525, y1: 450, x2: 712.5, y2: 525, type: "normal" },

    // Scaled new objects
    { x1: 37.5, y1: 37.5, x2: 75, y2: 37.5, type: "normal" },
    { x1: 75, y1: 37.5, x2: 75, y2: 75, type: "normal" },

    { x1: 600, y1: 37.5, x2: 637.5, y2: 37.5, type: "stopping" },
    { x1: 637.5, y1: 37.5, x2: 637.5, y2: 75, type: "stopping" },

    { x1: 37.5, y1: 525, x2: 75, y2: 525, type: "normal" },
    { x1: 75, y1: 525, x2: 75, y2: 562.5, type: "normal" },

    { x1: 600, y1: 525, x2: 637.5, y2: 525, type: "stopping" },
    { x1: 637.5, y1: 525, x2: 637.5, y2: 562.5, type: "stopping" },

    // Add some doors
    { x1: 225, y1: 75, x2: 225, y2: 150, type: "door" },
    { x1: 375, y1: 225, x2: 450, y2: 225, type: "door" },
];
