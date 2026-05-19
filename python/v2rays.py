"""
Ray Tracing v3: Advanced Features
Includes adjustable ray count with +/- keys.
Better visualization with gradient-based lighting.
"""

import pygame
import math
import sys
from typing import List, Tuple, Optional

# Initialize Pygame
pygame.init()

# Constants
SCREEN_WIDTH = 1024
SCREEN_HEIGHT = 768
FPS = 60
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
RED = (255, 0, 0)
BLUE = (0, 0, 255)
GREEN = (0, 255, 0)
GRAY = (128, 128, 128)
YELLOW = (255, 255, 0)
DARK_GRAY = (64, 64, 64)
ORANGE = (255, 165, 0)

class Player:
    def __init__(self, x: float, y: float, radius: float = 12):
        self.x = x
        self.y = y
        self.radius = radius
        self.speed = 5
    
    def handle_input(self, keys):
        """Handle player movement based on keyboard input"""
        if keys[pygame.K_w]:
            self.y -= self.speed
        if keys[pygame.K_s]:
            self.y += self.speed
        if keys[pygame.K_a]:
            self.x -= self.speed
        if keys[pygame.K_d]:
            self.x += self.speed
        
        # Keep player in bounds
        self.x = max(self.radius, min(SCREEN_WIDTH - self.radius, self.x))
        self.y = max(self.radius, min(SCREEN_HEIGHT - self.radius, self.y))
    
    def draw(self, screen):
        """Draw the player circle with a glow effect"""
        pygame.draw.circle(screen, YELLOW, (int(self.x), int(self.y)), self.radius)
        pygame.draw.circle(screen, BLUE, (int(self.x), int(self.y)), self.radius, 2)

class Wall:
    def __init__(self, x1: float, y1: float, x2: float, y2: float, color=GREEN):
        self.x1 = x1
        self.y1 = y1
        self.x2 = x2
        self.y2 = y2
        self.color = color
    
    def draw(self, screen):
        """Draw the wall"""
        pygame.draw.line(screen, self.color, (self.x1, self.y1), (self.x2, self.y2), 4)
    
    def get_intersection(self, ray_x: float, ray_y: float, 
                        ray_dx: float, ray_dy: float, 
                        max_distance: float = 500) -> Optional[Tuple[float, float, float]]:
        """
        Find intersection between ray and wall.
        Returns (intersection_x, intersection_y, distance) or None if no intersection.
        """
        x1, y1 = self.x1, self.y1
        x2, y2 = self.x2, self.y2
        
        denom = (x2 - x1) * (-ray_dy) - (y2 - y1) * (-ray_dx)
        
        if abs(denom) < 1e-10:
            return None
        
        t = ((x1 - ray_x) * (-ray_dy) - (y1 - ray_y) * (-ray_dx)) / denom
        s = ((x1 - ray_x) * (y2 - y1) - (y1 - ray_y) * (x2 - x1)) / denom
        
        if 0 < s < 1 and 0 < t < max_distance / math.sqrt(ray_dx**2 + ray_dy**2):
            int_x = ray_x + t * ray_dx
            int_y = ray_y + t * ray_dy
            distance = math.sqrt((int_x - ray_x)**2 + (int_y - ray_y)**2)
            return (int_x, int_y, distance)
        
        return None

class Ray:
    def __init__(self, x: float, y: float, angle: float, max_length: float = 500):
        self.start_x = x
        self.start_y = y
        self.angle = angle
        self.max_length = max_length
        self.end_x = x + max_length * math.cos(angle)
        self.end_y = y + max_length * math.sin(angle)
        self.hit_distance = max_length
    
    def update(self, x: float, y: float, angle: float):
        """Update ray position and angle"""
        self.start_x = x
        self.start_y = y
        self.angle = angle
        self.hit_distance = self.max_length
        self.end_x = x + self.max_length * math.cos(angle)
        self.end_y = y + self.max_length * math.sin(angle)
    
    def cast(self, walls: List[Wall]):
        """Cast ray and find closest wall intersection"""
        ray_dx = math.cos(self.angle)
        ray_dy = math.sin(self.angle)
        
        closest_distance = self.max_length
        closest_point = (self.end_x, self.end_y)
        
        for wall in walls:
            intersection = wall.get_intersection(self.start_x, self.start_y, 
                                               ray_dx, ray_dy, self.max_length)
            if intersection:
                int_x, int_y, distance = intersection
                if distance < closest_distance:
                    closest_distance = distance
                    closest_point = (int_x, int_y)
        
        self.hit_distance = closest_distance
        self.end_x, self.end_y = closest_point
    
    def draw(self, screen):
        """Draw the ray with color based on distance"""
        # Fade out color based on distance
        intensity = int(255 * (1 - self.hit_distance / self.max_length))
        color = (max(255, intensity), max(0, 200 - intensity), 0)
        pygame.draw.line(screen, color, (self.start_x, self.start_y), 
                        (self.end_x, self.end_y), 1)

class Game:
    def __init__(self):
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("Ray Tracing - V3: Advanced Features")
        self.clock = pygame.time.Clock()
        self.running = True
        
        # Create player
        self.player = Player(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2)
        
        # Create walls
        self.walls = [
            Wall(100, 100, 500, 100),      # Top wall
            Wall(500, 100, 500, 400),      # Right wall
            Wall(500, 400, 100, 400),      # Bottom wall
            Wall(100, 400, 100, 100),      # Left wall
            Wall(200, 200, 400, 300),      # Diagonal wall
            Wall(650, 150, 900, 200),      # Right side wall 1
            Wall(900, 200, 900, 500),      # Right side wall 2
            Wall(900, 500, 650, 550),      # Right side wall 3
            Wall(150, 600, 350, 650),      # Bottom left wall
            Wall(700, 600, 950, 700),      # Bottom right wall
        ]
        
        # Initialize ray count
        self.num_rays = 10
        self.rays = self.create_rays(self.num_rays)
        self.font = pygame.font.Font(None, 24)
        self.font_large = pygame.font.Font(None, 32)
    
    def create_rays(self, num_rays: int) -> List[Ray]:
        """Create evenly distributed rays around the player"""
        rays = []
        angle_step = (2 * math.pi) / num_rays
        for i in range(num_rays):
            angle = i * angle_step
            ray = Ray(self.player.x, self.player.y, angle)
            rays.append(ray)
        return rays
    
    def update_rays(self):
        """Update all rays to emit from player position and cast"""
        for i, ray in enumerate(self.rays):
            angle = (i / len(self.rays)) * 2 * math.pi
            ray.update(self.player.x, self.player.y, angle)
            ray.cast(self.walls)
    
    def handle_events(self):
        """Handle user input and window events"""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    self.running = False
                if event.key == pygame.K_EQUALS or event.key == pygame.K_PLUS:
                    self.num_rays = min(360, self.num_rays + 5)
                    self.rays = self.create_rays(self.num_rays)
                if event.key == pygame.K_MINUS:
                    self.num_rays = max(1, self.num_rays - 5)
                    self.rays = self.create_rays(self.num_rays)
    
    def update(self):
        """Update game state"""
        keys = pygame.key.get_pressed()
        self.player.handle_input(keys)
        self.update_rays()
    
    def draw(self):
        """Draw all game objects"""
        self.screen.fill(BLACK)
        
        # Draw walls
        for wall in self.walls:
            wall.draw(self.screen)
        
        # Draw rays
        for ray in self.rays:
            ray.draw(self.screen)
        
        # Draw player
        self.player.draw(self.screen)
        
        # Draw instructions
        text1 = self.font.render("WASD: Move | +/-: Rays | ESC: Quit", True, WHITE)
        text2 = self.font_large.render(f"Rays: {self.num_rays}", True, YELLOW)
        self.screen.blit(text1, (10, 10))
        self.screen.blit(text2, (10, 40))
        
        pygame.display.flip()
    
    def run(self):
        """Main game loop"""
        while self.running:
            self.handle_events()
            self.update()
            self.draw()
            self.clock.tick(FPS)
        
        pygame.quit()
        sys.exit()

if __name__ == "__main__":
    game = Game()
    game.run()
