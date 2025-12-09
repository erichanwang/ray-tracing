import tkinter as tk
import json

class MapVisualizer:
    def __init__(self, master):
        self.master = master
        self.master.title("Map Visualizer")
        self.canvas = tk.Canvas(self.master, width=1024, height=768, bg="black")
        self.canvas.pack()
        self.draw_map()

    def draw_map(self):
        with open("web4/map.js", "r") as f:
            js_content = f.read()
            # Extract the JSON part of the JavaScript file
            json_content = js_content[js_content.find("[") : js_content.rfind("]") + 1]
            map_data = json.loads(json_content)

        for wall in map_data:
            x1 = wall["x1"]
            y1 = wall["y1"]
            x2 = wall["x2"]
            y2 = wall["y2"]
            self.canvas.create_line(x1, y1, x2, y2, fill="green", width=4)

if __name__ == "__main__":
    root = tk.Tk()
    app = MapVisualizer(root)
    root.mainloop()
