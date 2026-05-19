#!/usr/bin/env python3
"""
Lanternlight Level Compiler
Reads and writes .level files for the Lanternlight dungeon crawler.

.level file format:
  name: <level name>
  description: <flavor text>
  crystalsNeeded: <number>
  grid:
  <rows of space-separated integers>

Grid legend:
  0 = empty floor     4 = player spawn      8 = platform
  1 = wall            5 = key               9 = spike trap
  2 = crystal         6 = locked door
  3 = exit portal     7 = stair up
"""

import sys
import json
import os

GRID_LEGEND = {
    'empty': 0,
    'wall': 1,
    'crystal': 2,
    'exit': 3,
    'spawn': 4,
    'key': 5,
    'door': 6,
    'stair': 7,
    'platform': 8,
    'spike': 9,
}

GRID_SYMBOLS = {v: k for k, v in GRID_LEGEND.items()}


def read_level(filepath):
    """Parse a .level file and return a dict with name, description, crystalsNeeded, grid."""
    with open(filepath, 'r') as f:
        lines = f.readlines()

    level = {}
    grid_lines = []
    in_grid = False

    for line in lines:
        stripped = line.strip()
        if stripped == '' or stripped.startswith('#'):
            continue
        if stripped == 'grid:':
            in_grid = True
            continue
        if in_grid:
            grid_lines.append(stripped)
        elif ':' in stripped:
            key, _, value = stripped.partition(':')
            key = key.strip()
            value = value.strip()
            if key == 'crystalsNeeded':
                level['crystalsNeeded'] = int(value)
            elif key == 'name':
                level['name'] = value
            elif key == 'description':
                level['description'] = value

    # Parse grid
    grid = []
    for line in grid_lines:
        if line.strip():
            row = [int(x) for x in line.split()]
            grid.append(row)

    level['grid'] = grid

    # Validate
    _validate_level(level)

    return level


def write_level(filepath, level):
    """Write a level dict to a .level file."""
    with open(filepath, 'w') as f:
        f.write(f"name: {level['name']}\n")
        f.write(f"description: {level['description']}\n")
        f.write(f"crystalsNeeded: {level['crystalsNeeded']}\n")
        f.write("grid:\n")
        for row in level['grid']:
            f.write(' '.join(str(cell) for cell in row) + '\n')


def _validate_level(level):
    """Validate a level for correctness."""
    grid = level['grid']
    rows = len(grid)
    if rows == 0:
        raise ValueError("Empty grid")
    cols = len(grid[0])
    for i, row in enumerate(grid):
        if len(row) != cols:
            raise ValueError(f"Row {i} has inconsistent width: {len(row)} vs {cols}")

    # Check required elements
    spawn_count = sum(1 for row in grid for cell in row if cell == 4)
    if spawn_count != 1:
        raise ValueError(f"Expected exactly 1 spawn point, found {spawn_count}")

    exit_count = sum(1 for row in grid for cell in row if cell == 3)
    if exit_count != 1:
        raise ValueError(f"Expected exactly 1 exit portal, found {exit_count}")

    # Verify all values are valid
    for i, row in enumerate(grid):
        for j, cell in enumerate(row):
            if cell not in GRID_SYMBOLS:
                raise ValueError(f"Invalid cell value {cell} at ({i},{j})")


def to_json(level):
    """Convert a level dict to JSON-serializable format (for JS consumption)."""
    return json.dumps(level, indent=2)


def list_levels(directory='.'):
    """List all .level files in a directory."""
    files = sorted(f for f in os.listdir(directory) if f.endswith('.level'))
    levels = []
    for f in files:
        try:
            level = read_level(os.path.join(directory, f))
            levels.append({
                'file': f,
                'name': level['name'],
                'rows': len(level['grid']),
                'cols': len(level['grid'][0]),
                'crystalsNeeded': level['crystalsNeeded'],
            })
        except Exception as e:
            levels.append({'file': f, 'error': str(e)})
    return levels


def main():
    if len(sys.argv) < 2:
        print("Lanternlight Level Compiler")
        print("Usage:")
        print("  python level_compiler.py read <file.level>         - Parse and display a level")
        print("  python level_compiler.py list [directory]          - List all .level files")
        print("  python level_compiler.py validate <file.level>     - Validate a level file")
        print("  python level_compiler.py tojson <file.level>       - Output level as JSON")
        sys.exit(0)

    cmd = sys.argv[1]

    if cmd == 'read':
        if len(sys.argv) < 3:
            print("Usage: python level_compiler.py read <file.level>")
            sys.exit(1)
        level = read_level(sys.argv[2])
        print(f"Name: {level['name']}")
        print(f"Description: {level['description']}")
        print(f"Crystals Needed: {level['crystalsNeeded']}")
        print(f"Grid: {len(level['grid'])}x{len(level['grid'][0])}")
        for row in level['grid']:
            print(' '.join(f'{c:2d}' for c in row))

    elif cmd == 'list':
        directory = sys.argv[2] if len(sys.argv) > 2 else '.'
        levels = list_levels(directory)
        if not levels:
            print(f"No .level files found in {directory}")
        for lv in levels:
            if 'error' in lv:
                print(f"  {lv['file']}: ERROR - {lv['error']}")
            else:
                print(f"  {lv['file']}: \"{lv['name']}\" ({lv['rows']}x{lv['cols']}, {lv['crystalsNeeded']} crystals)")

    elif cmd == 'validate':
        if len(sys.argv) < 3:
            print("Usage: python level_compiler.py validate <file.level>")
            sys.exit(1)
        try:
            level = read_level(sys.argv[2])
            print(f"✓ {sys.argv[2]} is valid: \"{level['name']}\" ({len(level['grid'])}x{len(level['grid'][0])})")
        except Exception as e:
            print(f"✗ {sys.argv[2]} is invalid: {e}")
            sys.exit(1)

    elif cmd == 'tojson':
        if len(sys.argv) < 3:
            print("Usage: python level_compiler.py tojson <file.level>")
            sys.exit(1)
        level = read_level(sys.argv[2])
        print(to_json(level))

    else:
        print(f"Unknown command: {cmd}")
        sys.exit(1)


if __name__ == '__main__':
    main()
