"""
Ray Tracing V4 - Sandbox + Soft Cone Vision (Darkness Mode B)
Features:
- Fixed ray/segment intersection math
- Player circular collision with sliding
- Move/select/drag walls (left click)
- Add walls with right click (two clicks: start & end)
- Delete walls with middle click (click near a wall)
- Toggle lights (L): Lights OFF -> only the fan polygon is visible
- Adjust ray count with '+'/'=' and '-' keys
"""

import pygame
import math
import sys
from typing import List, Optional, Tuple

pygame.init()

# --- Configuration ---
SCREEN_WIDTH = 1024
SCREEN_HEIGHT = 768
FPS = 60

WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
YELLOW = (240, 220, 70)
GREEN = (80, 200, 120)
BLUE = (90, 160, 255)
RED = (255, 100, 100)
WALL_COLOR = (120, 220, 160)

# --- Utility functions ---
def length(vx: float, vy: float) -> float:
    return math.hypot(vx, vy)

def clamp(v, a, b):
    return max(a, min(b, v))

def dist_point_segment(px, py, x1, y1, x2, y2) -> float:
    """Return distance from point to segment."""
    dx = x2 - x1
    dy = y2 - y1
    if dx == 0 and dy == 0:
        return math.hypot(px - x1, py - y1)
    t = ((px - x1) * dx + (py - y1) * dy) / (dx*dx + dy*dy)
    t = clamp(t, 0.0, 1.0)
    cx = x1 + t * dx
    cy = y1 + t * dy
    return math.hypot(px - cx, py - cy)

# --- Wall ---
class Wall:
    def __init__(self, x1: float, y1: float, x2: float, y2: float, color=WALL_COLOR):
        self.x1 = x1
        self.y1 = y1
        self.x2 = x2
        self.y2 = y2
        self.color = color

    def draw(self, surf, width=4):
        pygame.draw.line(surf, self.color, (self.x1, self.y1), (self.x2, self.y2), width)

    def distance_to_point(self, px, py) -> float:
        return dist_point_segment(px, py, self.x1, self.y1, self.x2, self.y2)

    def move_by(self, dx, dy):
        self.x1 += dx; self.x2 += dx
        self.y1 += dy; self.y2 += dy

    def closest_point(self, px, py) -> Tuple[float, float]:
        dx = self.x2 - self.x1
        dy = self.y2 - self.y1
        if dx == 0 and dy == 0:
            return (self.x1, self.y1)
        t = ((px - self.x1) * dx + (py - self.y1) * dy) / (dx*dx + dy*dy)
        t = clamp(t, 0.0, 1.0)
        return (self.x1 + t*dx, self.y1 + t*dy)

    def get_intersection(self, ray_x, ray_y, ray_dx, ray_dy, max_distance=1000) -> Optional[Tuple[float, float, float]]:
        """
        Ray: R(t) = (ray_x, ray_y) + t*(ray_dx, ray_dy), t >= 0
        Segment: S(u) = (x1,y1) + u*(x2-x1,y2-y1), 0 <= u <= 1
        Solve for t and u. Return (ix, iy, distance) if intersects within max_distance.
        """
        x1, y1, x2, y2 = self.x1, self.y1, self.x2, self.y2
        sx = x2 - x1
        sy = y2 - y1

        denom = ray_dx * sy - ray_dy * sx
        if abs(denom) < 1e-10:
            return None

        t = ((x1 - ray_x) * sy - (y1 - ray_y) * sx) / denom
        u = ((x1 - ray_x) * ray_dy - (y1 - ray_y) * ray_dx) / denom

        if t > 0 and 0 <= u <= 1:
            ix = ray_x + t * ray_dx
            iy = ray_y + t * ray_dy
            distance = math.hypot(ix - ray_x, iy - ray_y)
            if distance <= max_distance:
                return (ix, iy, distance)
        return None

# --- Ray ---
class Ray:
    def __init__(self, x, y, angle, max_length=800):
        self.start_x = x
        self.start_y = y
        self.angle = angle
        self.max_length = max_length
        self.end_x = x + math.cos(angle) * max_length
        self.end_y = y + math.sin(angle) * max_length
        self.hit_distance = max_length

    def update(self, x, y, angle):
        self.start_x = x
        self.start_y = y
        self.angle = angle
        self.end_x = x + math.cos(angle) * self.max_length
        self.end_y = y + math.sin(angle) * self.max_length
        self.hit_distance = self.max_length

    def cast(self, walls: List[Wall]):
        dx = math.cos(self.angle)
        dy = math.sin(self.angle)
        closest = self.max_length
        closest_point = (self.end_x, self.end_y)

        for w in walls:
            inter = w.get_intersection(self.start_x, self.start_y, dx, dy, self.max_length)
            if inter:
                ix, iy, distance = inter
                if distance < closest:
                    closest = distance
                    closest_point = (ix, iy)

        self.hit_distance = closest
        self.end_x, self.end_y = closest_point

    def draw(self, surf):
        # color intensity by distance
        t = clamp(1.0 - (self.hit_distance / self.max_length), 0.0, 1.0)
        intensity = int(180 + 75 * t)
        color = (intensity, int(160 * (1 - t) + 50 * t), int(60 * (1 - t)))
        pygame.draw.line(surf, color, (self.start_x, self.start_y), (self.end_x, self.end_y), 1)

# --- Player ---
class Player:
    def __init__(self, x, y, radius=8):
        self.x = x
        self.y = y
        self.radius = radius
        self.speed = 4.5

    def move_with_collision(self, dx, dy, walls: List[Wall]):
        # Attempt X movement
        new_x = self.x + dx
        collided_x = False
        for w in walls:
            if dist_point_segment(new_x, self.y, w.x1, w.y1, w.x2, w.y2) < self.radius:
                collided_x = True
                break
        if not collided_x:
            self.x = new_x
        # Attempt Y movement
        new_y = self.y + dy
        collided_y = False
        for w in walls:
            if dist_point_segment(self.x, new_y, w.x1, w.y1, w.x2, w.y2) < self.radius:
                collided_y = True
                break
        if not collided_y:
            self.y = new_y

        # keep inside screen bounds
        self.x = clamp(self.x, self.radius, SCREEN_WIDTH - self.radius)
        self.y = clamp(self.y, self.radius, SCREEN_HEIGHT - self.radius)

    def handle_input(self, keys, walls):
        dx = dy = 0.0
        if keys[pygame.K_w] or keys[pygame.K_UP]:
            dy -= self.speed
        if keys[pygame.K_s] or keys[pygame.K_DOWN]:
            dy += self.speed
        if keys[pygame.K_a] or keys[pygame.K_LEFT]:
            dx -= self.speed
        if keys[pygame.K_d] or keys[pygame.K_RIGHT]:
            dx += self.speed

        # Normalize diagonal speed
        if dx != 0 and dy != 0:
            scale = 1 / math.sqrt(2)
            dx *= scale
            dy *= scale

        self.move_with_collision(dx, dy, walls)

    def draw(self, surf):
        pygame.draw.circle(surf, YELLOW, (int(self.x), int(self.y)), self.radius)
        pygame.draw.circle(surf, BLUE, (int(self.x), int(self.y)), self.radius, 2)

# --- Game ---
class Game:
    def __init__(self):
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("Ray Tracing V4 - Sandbox (Soft Cone Vision)")
        self.clock = pygame.time.Clock()
        self.font = pygame.font.Font(None, 22)
        self.font_large = pygame.font.Font(None, 28)

        self.player = Player(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2)
        self.walls: List[Wall] = [
            Wall(100, 100, 500, 100),
            Wall(500, 100, 500, 400),
            Wall(500, 400, 100, 400),
            Wall(100, 400, 100, 100),
            Wall(200, 200, 400, 300),
            Wall(650, 150, 900, 200),
            Wall(900, 200, 900, 500),
            Wall(900, 500, 650, 550),
            Wall(150, 600, 350, 650),
            Wall(700, 600, 950, 700),
        ]

        self.num_rays = 90
        self.rays: List[Ray] = self.create_rays(self.num_rays)
        self.lights_on = True

        # Mouse/wall interaction state
        self.selected_wall: Optional[Wall] = None
        self.dragging = False
        self.drag_last_pos = (0, 0)

        # Adding new wall via right clicks (two-step)
        self.new_wall_start: Optional[Tuple[float, float]] = None

        self.running = True

    def create_rays(self, num_rays: int) -> List[Ray]:
        rays = []
        # evenly distribute 2*pi
        for i in range(num_rays):
            angle = (i / num_rays) * 2 * math.pi
            rays.append(Ray(self.player.x, self.player.y, angle))
        return rays

    def update_rays(self):
        for i, ray in enumerate(self.rays):
            angle = (i / len(self.rays)) * 2 * math.pi
            ray.update(self.player.x, self.player.y, angle)
            ray.cast(self.walls)

    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False

            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    self.running = False
                elif event.key in (pygame.K_PLUS, pygame.K_EQUALS):
                    self.num_rays = min(720, self.num_rays + 10)
                    self.rays = self.create_rays(self.num_rays)
                elif event.key == pygame.K_MINUS:
                    self.num_rays = max(3, self.num_rays - 10)
                    self.rays = self.create_rays(self.num_rays)
                elif event.key == pygame.K_l:
                    self.lights_on = not self.lights_on

            elif event.type == pygame.MOUSEBUTTONDOWN:
                mx, my = event.pos
                if event.button == 1:  # left click: select/drag wall
                    # find nearest wall within threshold
                    nearest = None
                    nearest_d = 1e9
                    for w in self.walls:
                        d = w.distance_to_point(mx, my)
                        if d < 12 and d < nearest_d:
                            nearest = w
                            nearest_d = d
                    if nearest:
                        self.selected_wall = nearest
                        self.dragging = True
                        self.drag_last_pos = (mx, my)
                    else:
                        self.selected_wall = None
                elif event.button == 3:  # right click: add wall (two-step)
                    if self.new_wall_start is None:
                        self.new_wall_start = (mx, my)
                    else:
                        sx, sy = self.new_wall_start
                        # Avoid zero-length walls
                        if math.hypot(mx - sx, my - sy) > 6:
                            self.walls.append(Wall(sx, sy, mx, my))
                        self.new_wall_start = None
                elif event.button == 2:  # middle click: delete wall if nearby
                    to_delete = None
                    for w in self.walls:
                        if w.distance_to_point(mx, my) < 10:
                            to_delete = w
                            break
                    if to_delete:
                        self.walls.remove(to_delete)

            elif event.type == pygame.MOUSEBUTTONUP:
                if event.button == 1 and self.dragging:
                    self.dragging = False
                    self.selected_wall = None

            elif event.type == pygame.MOUSEMOTION:
                if self.dragging and self.selected_wall:
                    mx, my = event.pos
                    lx, ly = self.drag_last_pos
                    dx = mx - lx
                    dy = my - ly
                    self.selected_wall.move_by(dx, dy)
                    self.drag_last_pos = (mx, my)

    def update(self):
        keys = pygame.key.get_pressed()
        self.player.handle_input(keys, self.walls)
        self.update_rays()

    def draw_scene(self, surf):
        # draw walls
        for w in self.walls:
            w.draw(surf, width=4)

        # draw new wall preview
        if self.new_wall_start:
            mx, my = pygame.mouse.get_pos()
            pygame.draw.line(surf, RED, self.new_wall_start, (mx, my), 2)
            pygame.draw.circle(surf, RED, (int(self.new_wall_start[0]), int(self.new_wall_start[1])), 4)

        # draw rays (thin)
        if self.lights_on:
            for ray in self.rays:
                ray.draw(surf)



        # draw player
        self.player.draw(surf)

    def draw_darkness_mask(self, surf):
        """
        Soft Cone Vision (Option B):
        Create a dark overlay and cut out the polygon formed by the ordered ray endpoints.
        """
        # create overlay with alpha
        dark = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), flags=pygame.SRCALPHA)
        dark.fill((0, 0, 0, 220))  # semi-opaque dark cover

        # build polygon points: player position followed by each ray endpoint in angle order
        pts = []
        for ray in self.rays:
            pts.append((ray.end_x, ray.end_y))

        # If there are fewer than 3 pts, skip
        if len(pts) >= 3:
            # draw transparent polygon to "clear" the dark overlay
            pygame.draw.polygon(dark, (0, 0, 0, 0), pts)
            # Optionally, draw a radial gradient by drawing several polygons with varying alpha
            # (kept simple here)

        # blit overlay on top
        surf.blit(dark, (0, 0))

    def draw_ui(self):
        lines = [
            "WASD / Arrows: Move    L: Toggle Lights    Right Click: Add wall (2 clicks)    Left Drag: Move wall",
            "Middle Click: Delete wall    +/-: Rays    ESC: Quit",
            f"Rays: {self.num_rays}    Lights: {'ON' if self.lights_on else 'OFF'}"
        ]
        y = 8
        for i, l in enumerate(lines):
            txt = self.font.render(l, True, WHITE)
            self.screen.blit(txt, (10, y))
            y += 22

    def run(self):
        while self.running:
            dt = self.clock.tick(FPS)
            self.handle_events()
            self.update()

            # draw world to screen first
            self.screen.fill(WHITE if not self.lights_on else BLACK)

            if self.lights_on:
                self.draw_scene(self.screen)
            else:
                # draw walls on light_overlay so only visible in lit area
                light_overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), flags=pygame.SRCALPHA)
                # draw walls
                for w in self.walls:
                    w.draw(light_overlay, width=4)
                # draw new wall preview
                if self.new_wall_start:
                    mx, my = pygame.mouse.get_pos()
                    pygame.draw.line(light_overlay, RED, self.new_wall_start, (mx, my), 2)
                    pygame.draw.circle(light_overlay, RED, (int(self.new_wall_start[0]), int(self.new_wall_start[1])), 4)
                # draw player on screen
                self.player.draw(self.screen)
                # compute polygon pts
                pts = []
                for r in self.rays:
                    pts.append((r.end_x, r.end_y))
                if len(pts) >= 3:
                    pygame.draw.polygon(light_overlay, (255, 220, 180, 60), pts)
                    pygame.draw.polygon(light_overlay, (255, 220, 180, 120), pts, 1)
                self.screen.blit(light_overlay, (0, 0))
                # dark mask makes outside unseeable
                self.draw_darkness_mask(self.screen)

            # draw UI on top
            self.draw_ui()

            pygame.display.flip()

        pygame.quit()
        sys.exit()

if __name__ == "__main__":
    Game().run()
