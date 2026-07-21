# PLOT — Visualización de Datos

PLOT permite generar visualizaciones de datos: gráficas de líneas, barras y pastel, con soporte para títulos, etiquetas, leyendas y colores personalizados. La salida es en formato SVG.

**Importación:**

```kafe
import plot;
```

---

## Referencia de Funciones

| Función | Firma Formal | Descripción |
|---------|-------------|-------------|
| `plot.figure` | `() -> VOID` | Inicializa el lienzo |
| `plot.title` | `(STR) -> VOID` | Establece el título |
| `plot.xlabel` | `(STR) -> VOID` | Etiqueta eje X |
| `plot.ylabel` | `(STR) -> VOID` | Etiqueta eje Y |
| `plot.color` | `(STR) -> VOID` | Color de serie |
| `plot.graph` | `(List[NUM], List[NUM]) -> VOID` | Gráfica de líneas |
| `plot.bar` | `(List[STR], List[NUM]) -> VOID` | Gráfico de barras |
| `plot.pie` | `(List[STR], List[NUM]) -> VOID` | Gráfico de pastel |
| `plot.render` | `() -> VOID` | Muestra la visualización |
| `plot.grid` | `() -> VOID` | Muestra cuadrícula |
| `plot.legend` | `() -> VOID` | Muestra leyenda |

---

## Ejemplo: Gráfica de Líneas

```kafe
import plot;

List[INT] t = [0, 1, 2, 3, 4];
List[INT] h = [0, 10, 40, 90, 160];

plot.figure();
plot.title("Crecimiento en el tiempo");
plot.xlabel("Tiempo");
plot.ylabel("Altura");
plot.color("blue");
plot.graph(t, h);
plot.render();
```

## Ejemplo: Gráfico de Barras

```kafe
import plot;

List[STR] cats = ["A", "B", "C", "D"];
List[INT] vals = [23, 45, 56, 78];

plot.figure();
plot.title("Comparación de Categorías");
plot.xlabel("Categoría");
plot.ylabel("Valor");
plot.bar(cats, vals);
plot.render();
```

## Ejemplo: Gráfico de Pastel

```kafe
import plot;

List[STR] labels = ["Rojo", "Azul", "Verde"];
List[INT] sizes = [35, 45, 20];

plot.figure();
plot.title("Distribución de Colores");
plot.pie(labels, sizes);
plot.render();
```

---

## Manejo de Errores

| Error | Causa |
|-------|-------|
| **Longitud** | `x` e `y` deben tener el mismo número de elementos |
| **Tipo** | `cats` debe ser `List[STR]`, `vals` debe ser `List[NUM]` |

!!! note "Nota"
    En el compilador web, toma captura del gráfico antes de cerrarlo. La descarga directa aún no está disponible.
