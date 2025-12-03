"""
Ray Tracing v1: Basic Ray Implementation
A simple ray tracing system with a player and rays in 2D space.
"""

import pygame
import math
import sys
from typing import List, Tuple

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

class Player:
    def __init__(self, x: float, y: float, radius: float = 10):
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
        """Draw the player circle"""
        pygame.draw.circle(screen, BLUE, (int(self.x), int(self.y)), self.radius)

class Ray:
    def __init__(self, x: float, y: float, angle: float, length: float = 500):
        self.x = x
        self.y = y
        self.angle = angle
        self.length = length
        self.end_x = x + length * math.cos(angle)
        self.end_y = y + length * math.sin(angle)
    
    def update(self, x: float, y: float, angle: float):
        """Update ray position and angle"""
        self.x = x
        self.y = y
        self.angle = angle
        self.end_x = x + self.length * math.cos(angle)
        self.end_y = y + self.length * math.sin(angle)
    
    def draw(self, screen):
        """Draw the ray as a line"""
        pygame.draw.line(screen, RED, (self.x, self.y), (self.end_x, self.end_y), 1)

class Wall:
    def __init__(self, x1: float, y1: float, x2: float, y2: float):
        self.x1 = x1
        self.y1 = y1
        self.x2 = x2
        self.y2 = y2
    
    def draw(self, screen):
        """Draw the wall"""
        pygame.draw.line(screen, GREEN, (self.x1, self.y1), (self.x2, self.y2), 3)

class Game:
    def __init__(self):
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("Ray Tracing - V1: Basic Rays")
        self.clock = pygame.time.Clock()
        self.running = True
        
        # Create player
        self.player = Player(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2)
        
        # Create rays around the player (10 rays)
        self.rays = self.create_rays(10)
        
        # Create walls
        self.walls = [
            Wall(100, 100, 500, 100),
            Wall(500, 100, 500, 400),
            Wall(500, 400, 100, 400),
            Wall(100, 400, 100, 100),
            Wall(200, 200, 400, 300),
            Wall(650, 150, 900, 200),
            Wall(900, 200, 900, 500),
            Wall(900, 500, 650, 550),
        ]
    
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
        """Update all rays to emit from player position"""
        for i, ray in enumerate(self.rays):
            angle = (i / len(self.rays)) * 2 * math.pi
            ray.update(self.player.x, self.player.y, angle)
    
    def handle_events(self):
        """Handle user input and window events"""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    self.running = False
    
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
        font = pygame.font.Font(None, 24)
        text = font.render("WASD: Move | ESC: Quit | Rays: " + str(len(self.rays)), True, WHITE)
        self.screen.blit(text, (10, 10))
        
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
