"""Розкладає знімок Timing Diagram у два рядки (такти 1–6 і 7–12) для вставки у Word."""
from PIL import Image, ImageDraw
src = Image.open('screenshots/timing_diagram.png').convert('RGB')
Y0, Y1 = 28, src.size[1]          # без панелі кнопок
NAMES = (0, 86)                   # колонка Signal Name (без Signal Value)
SPLIT = 950                       # між 6-м і 7-м імпульсом C
END = 1610
names = src.crop((NAMES[0], Y0, NAMES[1], Y1))
p1 = src.crop((172, Y0, SPLIT, Y1))
p2 = src.crop((SPLIT, Y0, END, Y1))
w = names.width + max(p1.width, p2.width)
h = names.height
gap = 24
out = Image.new('RGB', (w, 2 * h + gap), 'white')
for k, part in enumerate([p1, p2]):
    y = k * (h + gap)
    out.paste(names, (0, y))
    out.paste(part, (names.width, y))
d = ImageDraw.Draw(out)
out.save('screenshots/timing_diagram_2rows.png')
print(out.size)
