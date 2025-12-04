"""
Ray Tracing V4 - Soft Cone Vision (Fixed)
Features:
- Rays follow mouse
- Player circular collision
- Move/add/delete walls
- Lights toggle (L)
- Adjustable rays (+/-)
"""

import pygame
import math
import sys
from typing import List, Optional, Tuple

pygame.init()

# --- Config ---
SCREEN_WIDTH = 1024
SCREEN_HEIGHT = 768
FPS = 60

WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
YELLOW = (240, 220, 70)
BLUE = (90, 160, 255)
RED = (255, 100, 100)
WALL_COLOR = (120, 220, 160)

# --- Utility ---
def clamp(v, a, b):
    return max(a, min(b, v))

def dist_point_segment(px, py, x1, y1, x2, y2) -> float:
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
    def __init__(self, x1, y1, x2, y2, color=WALL_COLOR):
        self.x1, self.y1, self.x2, self.y2 = x1, y1, x2, y2
        self.color = color

    def draw(self, surf, width=4):
        pygame.draw.line(surf, self.color, (self.x1, self.y1), (self.x2, self.y2), width)

    def distance_to_point(self, px, py):
        return dist_point_segment(px, py, self.x1, self.y1, self.x2, self.y2)

    def move_by(self, dx, dy):
        self.x1 += dx; self.x2 += dx
        self.y1 += dy; self.y2 += dy

    def get_intersection(self, ray_x, ray_y, ray_dx, ray_dy, max_distance=1000):
        x1, y1, x2, y2 = self.x1, self.y1, self.x2, self.y2
        sx = x2 - x1
        sy = y2 - y1
        denom = ray_dx * (-sy) - ray_dy * (-sx)
        if abs(denom) < 1e-10:
            return None
        t = ((x1 - ray_x) * (-sy) - (y1 - ray_y) * (-sx)) / denom
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
        self.start_x, self.start_y = x, y
        self.angle = angle
        self.max_length = max_length
        self.end_x = x + math.cos(angle) * max_length
        self.end_y = y + math.sin(angle) * max_length
        self.hit_distance = max_length

    def update(self, x, y, angle):
        self.start_x, self.start_y = x, y
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
        t = clamp(1.0 - self.hit_distance / self.max_length, 0.0, 1.0)
        intensity = int(180 + 75 * t)
        color = (intensity, int(160 * (1 - t) + 50 * t), int(60 * (1 - t)))
        pygame.draw.line(surf, color, (self.start_x, self.start_y), (self.end_x, self.end_y), 1)

# --- Player ---
class Player:
    def __init__(self, x, y, radius=12):
        self.x, self.y = x, y
        self.radius = radius
        self.speed = 4.5

    def move_with_collision(self, dx, dy, walls: List[Wall]):
        new_x = self.x + dx
        if all(dist_point_segment(new_x, self.y, w.x1, w.y1, w.x2, w.y2) >= self.radius for w in walls):
            self.x = new_x
        new_y = self.y + dy
        if all(dist_point_segment(self.x, new_y, w.x1, w.y1, w.x2, w.y2) >= self.radius for w in walls):
            self.y = new_y
        self.x = clamp(self.x, self.radius, SCREEN_WIDTH - self.radius)
        self.y = clamp(self.y, self.radius, SCREEN_HEIGHT - self.radius)

    def handle_input(self, keys, walls):
        dx = dy = 0
        if keys[pygame.K_w] or keys[pygame.K_UP]: dy -= self.speed
        if keys[pygame.K_s] or keys[pygame.K_DOWN]: dy += self.speed
        if keys[pygame.K_a] or keys[pygame.K_LEFT]: dx -= self.speed
        if keys[pygame.K_d] or keys[pygame.K_RIGHT]: dx += self.speed
        if dx != 0 and dy != 0:
            scale = 1 / math.sqrt(2)
            dx *= scale; dy *= scale
        self.move_with_collision(dx, dy, walls)

    def draw(self, surf):
        pygame.draw.circle(surf, YELLOW, (int(self.x), int(self.y)), self.radius)
        pygame.draw.circle(surf, BLUE, (int(self.x), int(self.y)), self.radius, 2)

# --- Game ---
class Game:
    def __init__(self):
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("Ray Tracing V4 - Soft Cone Vision Fixed")
        self.clock = pygame.time.Clock()
        self.font = pygame.font.Font(None, 22)
        self.player = Player(SCREEN_WIDTH//2, SCREEN_HEIGHT//2)
        self.walls: List[Wall] = [
            Wall(100,100,500,100), Wall(500,100,500,400), Wall(500,400,100,400),
            Wall(100,400,100,100), Wall(200,200,400,300), Wall(650,150,900,200),
            Wall(900,200,900,500), Wall(900,500,650,550), Wall(150,600,350,650),
            Wall(700,600,950,700)
        ]
        self.num_rays = 90
        self.rays: List[Ray] = self.create_rays(self.num_rays)
        self.lights_on = True
        self.selected_wall: Optional[Wall] = None
        self.dragging = False
        self.drag_last_pos = (0,0)
        self.new_wall_start: Optional[Tuple[float,float]] = None
        self.running = True

    def create_rays(self, num_rays):
        return [Ray(self.player.x,self.player.y,0) for _ in range(num_rays)]

    def update_rays(self):
        mx, my = pygame.mouse.get_pos()
        player_angle = math.atan2(my - self.player.y, mx - self.player.x)
        FOV = math.pi / 2  # 90° cone
        start_angle = player_angle - FOV/2
        for i, ray in enumerate(self.rays):
            angle = start_angle + i * FOV / len(self.rays)
            ray.update(self.player.x, self.player.y, angle)
            ray.cast(self.walls)

    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT: self.running=False
            elif event.type == pygame.KEYDOWN:
                if event.key==pygame.K_ESCAPE: self.running=False
                elif event.key in (pygame.K_PLUS, pygame.K_EQUALS):
                    self.num_rays=min(720,self.num_rays+10); self.rays=self.create_rays(self.num_rays)
                elif event.key==pygame.K_MINUS:
                    self.num_rays=max(3,self.num_rays-10); self.rays=self.create_rays(self.num_rays)
                elif event.key==pygame.K_l:
                    self.lights_on = not self.lights_on
            elif event.type==pygame.MOUSEBUTTONDOWN:
                mx,my = event.pos
                if event.button==1:
                    nearest=None; nd=1e9
                    for w in self.walls:
                        d=w.distance_to_point(mx,my)
                        if d<12 and d<nd: nearest,nd=w,d
                    if nearest: self.selected_wall=nearest; self.dragging=True; self.drag_last_pos=(mx,my)
                    else: self.selected_wall=None
                elif event.button==3:
                    if self.new_wall_start is None: self.new_wall_start=(mx,my)
                    else:
                        sx,sy=self.new_wall_start
                        if math.hypot(mx-sx,my-sy)>6: self.walls.append(Wall(sx,sy,mx,my))
                        self.new_wall_start=None
                elif event.button==2:
                    to_delete=None
                    for w in self.walls:
                        if w.distance_to_point(mx,my)<10: to_delete=w; break
                    if to_delete: self.walls.remove(to_delete)
            elif event.type==pygame.MOUSEBUTTONUP:
                if event.button==1 and self.dragging: self.dragging=False; self.selected_wall=None
            elif event.type==pygame.MOUSEMOTION:
                if self.dragging and self.selected_wall:
                    mx,my=event.pos; lx,ly=self.drag_last_pos
                    self.selected_wall.move_by(mx-lx,my-ly)
                    self.drag_last_pos=(mx,my)

    def update(self):
        keys=pygame.key.get_pressed()
        self.player.handle_input(keys,self.walls)
        self.update_rays()

    def draw_scene(self):
        for w in self.walls: w.draw(self.screen)
        if self.new_wall_start:
            mx,my=pygame.mouse.get_pos()
            pygame.draw.line(self.screen,RED,self.new_wall_start,(mx,my),2)
            pygame.draw.circle(self.screen,RED,(int(self.new_wall_start[0]),int(self.new_wall_start[1])),4)
        for ray in self.rays:
            if self.lights_on: ray.draw(self.screen)
        for ray in self.rays: pygame.draw.circle(self.screen,(255,200,80),(int(ray.end_x),int(ray.end_y)),2)
        self.player.draw(self.screen)

    def draw_darkness_mask(self):
        dark=pygame.Surface((SCREEN_WIDTH,SCREEN_HEIGHT),flags=pygame.SRCALPHA)
        dark.fill((0,0,0,220))
        pts=[(ray.end_x,ray.end_y) for ray in self.rays]
        # sort points by angle around player
        pts.sort(key=lambda p: math.atan2(p[1]-self.player.y, p[0]-self.player.x))
        if len(pts)>=3:
            pygame.draw.polygon(dark,(0,0,0,0),pts)
        self.screen.blit(dark,(0,0))

    def draw_ui(self):
        lines=[
            "WASD/Arrows: Move    L: Toggle Lights    Right Click: Add wall (2 clicks)    Left Drag: Move wall",
            "Middle Click: Delete wall    +/-: Rays    ESC: Quit",
            f"Rays: {self.num_rays}    Lights: {'ON' if self.lights_on else 'OFF'}"
        ]
        y=8
        for l in lines:
            txt=self.font.render(l,True,WHITE)
            self.screen.blit(txt,(10,y))
            y+=22

    def run(self):
        while self.running:
            self.clock.tick(FPS)
            self.handle_events()
            self.update()
            self.screen.fill(BLACK)
            self.draw_scene()
            if not self.lights_on:
                self.draw_darkness_mask()
            self.draw_ui()
            pygame.display.flip()
        pygame.quit(); sys.exit()

if __name__=="__main__":
    Game().run()
