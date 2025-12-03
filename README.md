# Ray Tracing - Interactive Lighting System

A complete ray tracing implementation featuring interactive lighting with support for both Python (Pygame) and Web (HTML/CSS/JavaScript) versions.

## Features

- **Interactive Player**: Move around using WASD or Arrow keys as a circle character
- **Ray Casting**: 10 rays (customizable) emit from the player
- **Wall Collision**: Rays detect and stop at wall intersections
- **Lights Toggle**: Switch between full world view and light-based vision
- **Ray Count Control**: Increase or decrease the number of rays dynamically

## Project Structure

```
ray-tracing/
├── python/
│   ├── v1_basic_rays.py              # Basic ray implementation
│   ├── v2_collision_detection.py     # Ray-wall collision detection
│   └── v3_advanced_features.py       # Advanced features with ray count control
└── web/
    ├── index.html                     # Main HTML file
    ├── styles.css                     # Styling and layout
    └── script.js                      # Game logic and rendering
```

## Python Versions

### Prerequisites
```bash
pip install pygame
```

### v1 - Basic Rays
Simple implementation with rays emanating from the player without collision detection.
```bash
python python/v1_basic_rays.py
```

### v2 - Collision Detection
Implements ray-wall collision detection where rays stop when hitting walls.
```bash
python python/v2_collision_detection.py
```

### v3 - Advanced Features
Full implementation with adjustable ray count (+/- keys), improved visuals, and distance-based coloring.
```bash
python python/v3_advanced_features.py
```

## Web Version

Open `web/index.html` in your browser to play the web version.

### Controls
- **Arrow Keys / WASD**: Move the player
- **+ Button**: Increase ray count
- **- Button**: Decrease ray count
- **Lights Toggle**: Switch between full view and darkness mode

### Features
- Real-time ray casting
- Dynamic wall illumination
- Responsive canvas rendering
- Touch-friendly controls

## Gameplay

1. **Lights ON Mode**: You can see the entire environment with all rays displayed
2. **Lights OFF Mode**: Only walls illuminated by rays are visible, creating a flashlight effect
3. Adjust ray count to customize the vision cone size
4. Explore the environment and discover the interactive lighting effects

## Technical Details

### Ray-Wall Intersection
The game uses line-line intersection algorithm to detect where rays hit walls:
- Parametric line equations for both rays and walls
- Closest intersection detection for proper wall occlusion
- Distance-based ray coloring for visual feedback

### Performance
- Optimized ray casting with early termination
- Efficient wall illumination detection
- Smooth 60 FPS rendering in both implementations

## License

MIT
