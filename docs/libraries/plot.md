# PLOT — Data visualization

PLOT generates data visualizations, including line, bar, and pie charts, with support for titles, labels, legends, and custom colors. Output is in SVG format.

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
| `plot.graph` | `(List[NUM], List[NUM]) -> VOID` | Draws a line chart |
| `plot.bar` | `(List[STR], List[NUM]) -> VOID` | Draws a bar chart |
| `plot.pie` | `(List[STR], List[NUM]) -> VOID` | Draws a pie chart |
| `plot.render` | `() -> VOID` | Displays the visualization |
| `plot.grid` | `() -> VOID` | Displays a grid |
| `plot.legend` | `() -> VOID` | Displays the legend |

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
plot.bar(categories, values);
plot.render();
```

## Example: Pie chart

```kafe
import plot;

List[STR] labels = ["Red", "Blue", "Green"];
List[INT] sizes = [35, 45, 20];

plot.figure();
plot.title("Color distribution");
plot.pie(labels, sizes);
plot.render();
```

---

## Error handling

| Error | Cause |
|-------|-------|
| **Length** | `x` and `y` must contain the same number of elements |
| **Type** | `categories` must be `List[STR]`; `values` must be `List[NUM]` |

!!! note "Note"
    In the web compiler, capture the chart before closing it. Direct download is not yet available.
