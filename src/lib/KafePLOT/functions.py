from global_utils import check_sig
from TypeUtils import (
    string_type,
    boolean_type,
    build_list_type,
    integer_type,
    get_data_type,
    numeric_vector_types,
    numeric_matrix_types,
)
from errors import raiseFunctionIncorrectArgumentType
from lib.KafeMATH.functions import radians, sin, cos
import lib.KafePLOT.utils as utils


@check_sig([0], [])
def figure():

    utils.reset_variables()
    utils._figure_active = True


@check_sig([1], [string_type])
def legend(value):
    utils.pie_legend = value


@check_sig([1], [boolean_type])
def barValues(value):
    utils.show_bar_values = value


@check_sig([1], [string_type])
def xlabel(x_label):
    utils.x_label = x_label


@check_sig([1], [string_type])
def ylabel(y_label):
    utils.y_label = y_label


@check_sig([1], [string_type])
def title(title):
    utils.chart_title = title


@check_sig([1], [boolean_type])
def grid(value):
    utils.show_grid = value


@check_sig([1], [string_type])
def color(value):
    utils.line_color = value


@check_sig([1], [string_type])
def pointColor(value):
    utils.point_color = value


@check_sig([1], [integer_type])
def pointSize(value):
    utils.point_size = value


@check_sig(
    {
        1: (numeric_vector_types + numeric_matrix_types,),
        2: (numeric_vector_types + numeric_matrix_types, numeric_vector_types + [string_type]),
        3: (numeric_vector_types, numeric_vector_types, [string_type]),
    },
    function_name="graph",
)
def graph(*args):
    n = len(args)

    if n == 1:
        datum = args[0]

        data_type = get_data_type(datum)
        if data_type in numeric_vector_types:
            ys = datum
            xs = list(range(len(ys)))
            style = "both"

        elif (
            isinstance(datum, list)
            and len(datum) > 0
            and all(isinstance(pair, list) and len(pair) == 2 for pair in datum)
        ):

            xs, ys = [], []
            for pair in datum:
                x_val, y_val = pair

                x_type = get_data_type(x_val)
                y_type = get_data_type(y_val)
                if x_type not in numeric_vector_types and not isinstance(
                    x_val, (int, float)
                ):
                    raiseFunctionIncorrectArgumentType("graph", x_val, x_type)
                if y_type not in numeric_vector_types and not isinstance(
                    y_val, (int, float)
                ):
                    raiseFunctionIncorrectArgumentType("graph", y_val, y_type)
                xs.append(x_val)
                ys.append(y_val)
            style = "both"

        else:
            raiseFunctionIncorrectArgumentType("graph", datum, get_data_type(datum))

    elif n == 2:
        first, second = args

        if isinstance(second, str):
            datum = first
            estilo_raw = second

            if (
                isinstance(datum, list)
                and len(datum) > 0
                and all(isinstance(pair, list) and len(pair) == 2 for pair in datum)
            ):
                xs, ys = [], []
                for pair in datum:
                    x_val, y_val = pair[0], pair[1]

                    x_type = get_data_type(x_val)
                    y_type = get_data_type(y_val)
                    if x_type not in numeric_vector_types and not isinstance(
                        x_val, (int, float)
                    ):
                        raiseFunctionIncorrectArgumentType("graph", x_val, x_type)
                    if y_type not in numeric_vector_types and not isinstance(
                        y_val, (int, float)
                    ):
                        raiseFunctionIncorrectArgumentType("graph", y_val, y_type)
                    xs.append(x_val)
                    ys.append(y_val)

                style = estilo_raw.lower()
                if style not in ("line", "point", "both"):
                    raise Exception("graph: style must be 'line', 'point' or 'both'")
            else:
                raise Exception(
                    "graph: when passing two arguments, the first must be a list of pairs [[x,y],...] "
                    "and the second must be a string with the style ('line', 'point' or 'both')."
                )

        else:
            xs, ys = first, second
            xs_type = get_data_type(xs)
            ys_type = get_data_type(ys)
            if xs_type not in numeric_vector_types:
                raiseFunctionIncorrectArgumentType("graph", xs, xs_type)
            if ys_type not in numeric_vector_types:
                raiseFunctionIncorrectArgumentType("graph", ys, ys_type)
            if len(xs) != len(ys):
                raise Exception("graph: x and y lists must have the same length")
            style = "both"

    else:
        xs, ys, estilo_raw = args

        xs_type = get_data_type(xs)
        ys_type = get_data_type(ys)
        if xs_type not in numeric_vector_types:
            raiseFunctionIncorrectArgumentType("graph", xs, xs_type)
        if ys_type not in numeric_vector_types:
            raiseFunctionIncorrectArgumentType("graph", ys, ys_type)
        if len(xs) != len(ys):
            raise Exception("graph: x and y lists must have the same length")

        if not isinstance(estilo_raw, str):
            raise Exception("graph: style must be a literal string")
        style = estilo_raw.lower()
        if style not in ("line", "point", "both"):
            raise Exception("graph: style must be 'line', 'point' or 'both'")

    auto_show = False
    if not utils._figure_active:
        utils.reset_variables()
        utils._figure_active = True
        auto_show = True

    series_info = {
        "xs": xs[:],
        "ys": ys[:],
        "line_color": utils.line_color,
        "point_color": utils.point_color,
        "point_size": utils.point_size,
        "draw_line": (style in ("line", "both")),
        "draw_point": (style in ("point", "both")),
    }
    utils._accumulated_series.append(series_info)

    if auto_show:
        render()


@check_sig([0], [])
def render():

    if not utils._figure_active or len(utils._accumulated_series) == 0:
        raise Exception(
            "render: No active figure or graph() was not called before"
        )

    total_width = 700
    total_height = 350
    legend_space = 200
    plot_width = total_width - legend_space
    height = total_height

    all_x = [x for series in utils._accumulated_series for x in series["xs"]]
    all_y = [y for series in utils._accumulated_series for y in series["ys"]]
    max_x, min_x = max(all_x), min(all_x)
    max_y, min_y = max(all_y), min(all_y)
    x_range = max_x - min_x + 1e-5
    y_range = max_y - min_y + 1e-5

    labels_and_numbers = [round(min_y + i * (max_y - min_y) / 5, 1) for i in range(6)]
    longest_number = max(len(str(num)) for num in labels_and_numbers)
    padding = int(10 + (longest_number + 2) * 6 + 20)

    def x_scale(x):
        return padding + int((x - min_x) / x_range * (plot_width - 2 * padding))

    def y_scale(y):
        return height - padding - int((y - min_y) / y_range * (height - 2 * padding))

    content = f'<svg width="{total_width}" height="{total_height}" xmlns="http://www.w3.org/2000/svg">\n'
    content += f'  <rect x="0" y="0" width="{total_width}" height="{total_height}" fill="white"/>\n'

    if utils.show_grid:

        for i in range(6):
            y_value = min_y + i * (max_y - min_y) / 5
            y = y_scale(y_value)
            content += (
                f'  <line x1="{padding}" y1="{y}" '
                f'x2="{plot_width - padding}" y2="{y}" '
                f'stroke="#ddd" stroke-width="1"/>\n'
            )

        for i in range(6):
            x_value = min_x + i * (max_x - min_x) / 5
            x_svg = x_scale(x_value)
            content += (
                f'  <line x1="{x_svg}" y1="{padding}" '
                f'x2="{x_svg}" y2="{height - padding}" '
                f'stroke="#ddd" stroke-width="1"/>\n'
            )

    for series in utils._accumulated_series:
        xs = series["xs"]
        ys = series["ys"]
        line_color = series["line_color"]
        clr_puntos = series["point_color"]
        tam = series["point_size"]
        draw_line = series["draw_line"]
        draw_point = series["draw_point"]

        if draw_line:
            for i in range(len(xs) - 1):
                x1, y1 = x_scale(xs[i]), y_scale(ys[i])
                x2, y2 = x_scale(xs[i + 1]), y_scale(ys[i + 1])
                content += (
                    f'  <line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" '
                    f'stroke="{line_color}" stroke-width="2" />\n'
                )

        if draw_point:
            for xv, yv in zip(xs, ys):
                x_svg, y_svg = x_scale(xv), y_scale(yv)
                content += f'  <circle cx="{x_svg}" cy="{y_svg}" r="{tam}" fill="{clr_puntos}"/>\n'

    content += (
        f'  <line x1="{padding}" y1="{height - padding}" '
        f'x2="{plot_width - padding}" y2="{height - padding}" '
        f'stroke="black" stroke-width="1" />\n'
    )

    content += (
        f'  <line x1="{padding}" y1="{padding}" '
        f'x2="{padding}" y2="{height - padding}" '
        f'stroke="black" stroke-width="1" />\n'
    )

    for i in range(6):
        y_value = min_y + i * (max_y - min_y) / 5
        y_pos = y_scale(y_value)
        content += (
            f'  <text x="{padding - 10}" y="{y_pos + 4}" '
            f'font-size="10" text-anchor="end">{round(y_value, 1)}</text>\n'
        )

    for xval in sorted(set(all_x)):
        x_pos = x_scale(xval)
        content += (
            f'  <text x="{x_pos}" y="{height - padding + 15}" '
            f'font-size="10" text-anchor="middle">{round(xval, 1)}</text>\n'
        )

    if utils.chart_title:
        content += (
            f'  <text x="{total_width // 2}" y="20" '
            f'font-size="14" text-anchor="middle" font-weight="bold">'
            f"{utils.chart_title}</text>\n"
        )

    if utils.x_label:
        x_center_plot = padding + (plot_width - 2 * padding) // 2
        content += (
            f'  <text x="{x_center_plot}" y="{height - 5}" '
            f'font-size="12" text-anchor="middle">{utils.x_label}</text>\n'
        )

    if utils.y_label:
        content += (
            f'  <g transform="translate(20,{height // 2}) rotate(-90)">'
            f'<text font-size="12" text-anchor="middle">{utils.y_label}</text></g>\n'
        )

    if utils.pie_legend:

        x_label = plot_width + 20
        y_label = 30
        lines = [
            line.strip()
            for line in utils.pie_legend.split(";")
            if line.strip() != ""
        ]
        box_height = 20 * len(lines) + 40
        box_width = legend_space - 40

        content += (
            f'  <rect x="{x_label - 10}" y="{y_label - 25}" '
            f'width="{box_width}" height="{box_height}" '
            f'fill="white" stroke="#ccc" rx="5"/>\n'
        )

        content += (
            f'  <text x="{x_label}" y="{y_label}" '
            f'font-size="12" font-weight="bold">Leyenda</text>\n'
        )

        y_offset = y_label + 20
        for line in lines:

            if ":" in line:
                color_str, text = line.split(":", 1)
                color_str = color_str.strip()
                text = text.strip()
                content += (
                    f'  <rect x="{x_label}" y="{y_offset - 10}" '
                    f'width="10" height="10" fill="{color_str}"/>\n'
                )
                content += (
                    f'  <text x="{x_label + 15}" y="{y_offset}" '
                    f'font-size="10">{text}</text>\n'
                )
            else:

                content += (
                    f'  <text x="{x_label}" y="{y_offset}" '
                    f'font-size="10">{line}</text>\n'
                )
            y_offset += 20

    content += "</svg>\n"

    utils.save_svg(content)
    utils.reset_variables()


@check_sig([2], [build_list_type(1, str)], numeric_vector_types)
def bar(labels, values):
    if len(labels) != len(values):
        raise Exception("bar: labels and values must have the same length")

    width = 500
    height = 300
    padding = 60

    max_val = max(values)
    bar_width = max(int((width - 2 * padding) / len(values)), 5) if len(values) > 0 else 1

    svg = (
        f'<svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">\n'
    )
    svg += f'<rect width="100%" height="100%" fill="white"/>\n'

    if max_val == 0:
        svg += f'<text x="{width // 2}" y="{height // 2}" font-size="14" text-anchor="middle">All values are zero</text>\n'
        svg += "</svg>"
        utils.save_svg(svg)
        utils.reset_variables()
        return

    for i in range(6):
        val = round(max_val * i / 5)
        y = height - padding - int((val / max_val) * (height - 2 * padding))
        svg += f'<line x1="{padding}" y1="{y}" x2="{width - padding}" y2="{y}" stroke="#ccc" />\n'
        svg += f'<text x="{padding - 10}" y="{y + 4}" font-size="10" text-anchor="end">{val}</text>\n'

    for i, (label, val) in enumerate(zip(labels, values)):
        x = padding + i * bar_width
        h = int((val / max_val) * (height - 2 * padding))
        y = height - padding - h
        svg += f'<rect x="{x}" y="{y}" width="{bar_width - 5}" height="{h}" fill="steelblue" />\n'
        svg += f'<text x="{x + bar_width // 2}" y="{height - padding + 15}" font-size="10" text-anchor="middle">{label}</text>\n'
        if utils.show_bar_values:
            svg += f'<text x="{x + bar_width // 2}" y="{y - 5}" font-size="10" text-anchor="middle">{val}</text>\n'

    if utils.chart_title:
        svg += f'<text x="{width // 2}" y="20" font-size="14" font-weight="bold" text-anchor="middle">{utils.chart_title}</text>\n'
    if utils.y_label:
        svg += f'<g transform="translate(20,{height // 2}) rotate(-90)"><text font-size="12" text-anchor="middle">{utils.y_label}</text></g>\n'

    svg += f'<line x1="{padding}" y1="{height - padding}" x2="{width - padding}" y2="{height - padding}" stroke="black" stroke-width="1" />\n'
    svg += f'<line x1="{padding}" y1="{padding}" x2="{padding}" y2="{height - padding}" stroke="black" stroke-width="1"/>\n'

    svg += "</svg>"
    utils.save_svg(svg)
    utils.reset_variables()


@check_sig([2], [build_list_type(1, str)], numeric_vector_types)
def pie(labels, values):
    if len(labels) != len(values):
        raise Exception("pie: labels and values must have the same length")

    total = sum(values)
    if total == 0:
        raise Exception("plot.pie: Total must be greater than zero")

    width = height = 600
    cx = int(width * 0.40)
    cy = height // 2
    radius = int(width * 0.3)

    start_angle = -180
    colors = [
        "#f4d03f",
        "#82e0aa",
        "#ec7063",
        "#85c1e9",
        "#bb8fce",
        "#f5b7b1",
        "#f1948a",
        "#7fb3d5",
        "#f8c471",
        "#aed6f1",
    ]

    svg = (
        f'<svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">\n'
    )
    svg += f'<rect width="100%" height="100%" fill="white"/>\n'

    for i, (label, val) in enumerate(zip(labels, values)):
        angle = val / total * 360
        end_angle = start_angle + angle

        x1 = cx + radius * cos(radians(start_angle))
        y1 = cy + radius * sin(radians(start_angle))
        x2 = cx + radius * cos(radians(end_angle))
        y2 = cy + radius * sin(radians(end_angle))

        large_arc = 1 if angle > 180 else 0
        color_segment = colors[i % len(colors)]

        path = f"M {cx},{cy} L {x1},{y1} A {radius},{radius} 0 {large_arc},1 {x2},{y2} Z"
        svg += f'<path d="{path}" fill="{color_segment}" stroke="white" stroke-width="1"/>\n'

        mid_angle = start_angle + angle / 2
        tx = cx + (radius / 1.5) * cos(radians(mid_angle))
        ty = cy + (radius / 1.5) * sin(radians(mid_angle))
        percentage = round(val / total * 100, 1)
        svg += f'<text x="{tx}" y="{ty}" font-size="12" text-anchor="middle" dominant-baseline="middle">{percentage}%</text>\n'

        start_angle = end_angle

    if utils.pie_legend:
        x_label = width - 170
        y_label = 40
        box_height = 20 * len(labels) + 60

        svg += f'<rect x="{x_label - 10}" y="{y_label - 25}" width="160" height="{box_height}" fill="white" stroke="#ccc" rx="5"/>\n'
        svg += f"""<text x="{x_label}" y="{y_label}" font-size="12" font-weight="bold">
  <tspan x="{x_label}" dy="0">Leyenda</tspan>
</text>\n"""
        for i, label in enumerate(labels):
            y_offset = y_label + 30 + i * 20
            color_segment = colors[i % len(colors)]
            svg += f'<rect x="{x_label}" y="{y_offset - 10}" width="10" height="10" fill="{color_segment}"/>\n'
            svg += f'<text x="{x_label + 15}" y="{y_offset}" font-size="10">{label}</text>\n'

    svg += "</svg>\n"
    utils.save_svg(svg)
    utils.reset_variables()
