from PIL import Image
import os

def hex_to_rgb(hex_color):
    """Convert hex color string to RGB tuple."""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def generate_tile_images():
    # Create assets directory if it doesn't exist
    os.makedirs('assets/tiles', exist_ok=True)

    # Tile size
    tile_size = 25

    # Generate different tile variations
    tile_types = [
        ('grass', '#228B22', '#32CD32'),  # Green grass
        ('dirt', '#8B4513', '#A0522D'),   # Brown dirt
        ('stone', '#696969', '#808080'), # Gray stone
        ('wood', '#8B4513', '#D2691E'),  # Wooden floor
    ]

    for tile_name, color1_hex, color2_hex in tile_types:
        # Convert hex to RGB
        color1 = hex_to_rgb(color1_hex)
        color2 = hex_to_rgb(color2_hex)

        # Create a new image
        img = Image.new('RGB', (tile_size, tile_size), color1)

        # Add some variation by drawing pixels
        pixels = img.load()
        for x in range(tile_size):
            for y in range(tile_size):
                # Simple checkerboard pattern
                if (x + y) % 2 == 0:
                    pixels[x, y] = color1
                else:
                    pixels[x, y] = color2

        # Save the image
        img.save(f'assets/tiles/{tile_name}.png')
        print(f'Generated {tile_name}.png')

if __name__ == '__main__':
    generate_tile_images()
