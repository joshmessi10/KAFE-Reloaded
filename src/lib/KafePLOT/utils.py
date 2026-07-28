import os
import globals

x_label = ""
y_label = ""
chart_title = ""
show_grid = False
line_color = "blue"
point_color = "red"
point_size = 3
show_bar_values = False
pie_legend = None

_figure_active = False
_accumulated_series = []


def reset_variables():
    global x_label, y_label, chart_title, show_bar_values
    global show_grid, point_color, line_color, point_size, pie_legend
    global _figure_active, _accumulated_series

    x_label = ""
    y_label = ""
    chart_title = ""
    show_grid = False
    line_color = "blue"
    point_color = "red"
    point_size = 3
    show_bar_values = False
    pie_legend = None

    _figure_active = False
    _accumulated_series = []


def save_svg(content):
    dest_folder = os.path.dirname(globals.ruta_programa)
    svg_name = os.path.splitext(os.path.basename(globals.ruta_programa))[0] + ".svg"
    svg_path = os.path.join(dest_folder, svg_name)

    with open(svg_path, "w", encoding="utf-8") as f:
        f.write(content)
