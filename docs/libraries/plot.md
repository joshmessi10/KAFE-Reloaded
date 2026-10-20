# PLOT — Data visualization

PLOT generates data visualizations, including line, scatter, bar, and pie charts, with support for titles, labels, legends, and custom colors. Output is in SVG format.

**Import:**

```kafe
import plot;
```

---

## Function reference

| Function | Signature | Description |
|---------|-------------|-------------|
| `plot.figure` | `() -> VOID` | Initializes the canvas |
| `plot.title` | `(STR) -> VOID` | Sets the title |
| `plot.xlabel` | `(STR) -> VOID` | Labels the x-axis |
| `plot.ylabel` | `(STR) -> VOID` | Labels the y-axis |
| `plot.color` | `(STR) -> VOID` | Sets the series color |
| `plot.graph` | `(x, y, style?) -> VOID` | Adds a line, point, or combined series |
| `plot.bar` | `(List[STR], List[NUM]) -> VOID` | Draws a bar chart |
| `plot.pie` | `(List[STR], List[NUM]) -> VOID` | Draws a pie chart |
| `plot.render` | `() -> VOID` | Renders the chart as SVG |
| `plot.grid` | `(BOOL) -> VOID` | Enables or disables a grid |
| `plot.legend` | `(STR) -> VOID` | Sets a legend label |

---

## Example: Line chart

```kafe
import plot;

List[INT] t = [0, 1, 2, 3, 4];
List[INT] h = [0, 10, 40, 90, 160];

plot.figure();
plot.title("Growth over time");
plot.xlabel("Time");
plot.ylabel("Height");
plot.color("blue");
plot.graph(t, h);
plot.render();
```

## Example: Bar chart

```kafe
import plot;

List[STR] categories = ["A", "B", "C", "D"];
List[INT] values = [23, 45, 56, 78];

plot.figure();
plot.title("Category comparison");
plot.xlabel("Category");
plot.ylabel("Value");
plot.bar(categories, values); -- Saves the SVG immediately
```

## Example: Pie chart

```kafe
import plot;

List[STR] labels = ["Red", "Blue", "Green"];
List[INT] sizes = [35, 45, 20];

plot.figure();
plot.title("Color distribution");
plot.pie(labels, sizes); -- Saves the SVG immediately
```

---

## Error handling

| Error | Cause |
|-------|-------|
| **Length** | `x` and `y` must contain the same number of elements |
| **Type** | `categories` must be `List[STR]`; `values` must be `List[NUM]` |

!!! note "Note"
    Plots are produced when the KAFE program runs. A documentation code block displays source code only; it does not run the program or show its SVG output. View the generated SVG in the runtime output or next to the executed program, depending on how you run KAFE.

## Plot lifecycle and chart types

For `graph`, call `figure()` to start a new chart, set labels and colors, add one or more series, then call `render()` once. `bar()` and `pie()` save their SVG immediately; do not call `render()` after either one unless you also added a `graph` series. `graph(x, y, style)` accepts `"line"`, `"point"` or `"both"`. With two numeric lists it defaults to both; with one numeric list, x-coordinates are generated from indices. `graph([[x, y], ...], "point")` also accepts coordinate pairs.

| Function | Purpose |
|---|---|
| `pointColor(name)` | Set scatter point color. |
| `pointSize(size)` | Set point size. |
| `barValues(enabled)` | Toggle labels above bars. |
| `grid(enabled)` | Toggle the grid with a Boolean. |
| `legend(label)` | Set the legend label. |

```kafe
import plot;
List[FLOAT] x = [1.0, 2.0, 3.0];
List[FLOAT] y = [2.0, 4.0, 3.0];
plot.figure();
plot.title("Measured samples");
plot.xlabel("Input");
plot.ylabel("Output");
plot.pointColor("yellow");
plot.graph(x, y, "point");
plot.render();
```

Use a scatter chart for pairs of numeric observations, a line for an ordered trend, bars for categories and a pie chart for parts of a whole. See the [K-Means example](../ejemplos/machine/kmeans.md) for a plot inside an ML workflow.
