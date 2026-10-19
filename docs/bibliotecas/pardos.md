# PARDOS — DataFrames

PARDOS es la librería de DataFrames de KAFE, inspirada en Pandas. Permite cargar, manipular y analizar datos tabulares desde archivos CSV.

**Importación:**

```kafe
import pardos;
```

---

## Funciones Principales

| Función | Firma | Descripción |
|---------|-------|-------------|
| `pardos.read_csv` | `(STR) -> PARDOS` | Lee un archivo CSV y retorna un DataFrame |
| `pardos.DataFrame` | `(List[STR], List[List[ANY]]) -> PARDOS` | Crea un DataFrame desde columnas y datos |

---

## Métodos de DataFrame

### Exploración

| Método | Firma | Descripción |
|--------|-------|-------------|
| `df.head` | `(n?) -> PARDOS` | Primeras n filas (default: 5) |
| `df.tail` | `(n?) -> PARDOS` | Últimas n filas (default: 5) |
| `df.shape` | `() -> List[INT]` | [filas, columnas] |
| `df.col` | `(STR) -> List[ANY]` | Retorna una columna como lista |
| `df.dtypes` | `() -> List[List[STR]]` | Tipos de cada columna |
| `df.info` | `() -> STR` | Resumen del DataFrame |
| `df.describe` | `() -> PARDOS` | Estadísticas descriptivas |

### Agrupación y Análisis

| Método | Firma | Descripción |
|--------|-------|-------------|
| `df.value_counts` | `(STR) -> PARDOS` | Cuenta ocurrencias de cada valor único |
| `df.mean` | `(STR) -> FLOAT` | Media aritmética de una columna |
| `df.sum` | `(STR) -> FLOAT` | Suma de una columna |
| `df.agg` | `(STR, STR) -> NUM` | Agregación: `sum`, `mean`, `min`, `max`, `count` |
| `df.round` | `(n?) -> PARDOS` | Redondea valores flotantes (default: 4 decimales) |

### Filtrado

| Método | Firma | Descripción |
|--------|-------|-------------|
| `df.query` | `(STR) -> PARDOS` | Filtra filas usando expresión KAFE |

---

## Ejemplo: Crear DataFrame

```kafe
import pardos;

List[STR] cols = ["nombre", "edad", "ciudad"];
List[List[ANY]] data = [
    ["Ana", 25, "Bogotá"],
    ["Luis", 30, "Medellín"],
    ["María", 28, "Cali"]
];

PARDOS df = pardos.DataFrame(cols, data);
show(df);
```

## Ejemplo: Leer CSV

```kafe
import pardos;

PARDOS df = pardos.read_csv("datos.csv");
show(df.head(3));
show(df.shape);
show(df.dtypes);
```

## Ejemplo: Estadísticas

```kafe
import pardos;

PARDOS df = pardos.read_csv("ventas.csv");

-- Media de una columna
FLOAT media_ventas = df.mean("ventas");
show("Media de ventas: " + str(media_ventas));

-- Suma total
FLOAT total = df.sum("ventas");
show("Total: " + str(total));

-- Estadísticas completas
PARDOS stats = df.describe();
show(stats);

-- Conteo de valores
PARDOS conteo = df.value_counts("categoria");
show(conteo);
```

## Ejemplo: Filtrado con query

```kafe
import pardos;

PARDOS df = pardos.read_csv("empleados.csv");

-- Filtro simple
PARDOS mayores = df.query("edad > 30");
show(mayores);

-- Filtro múltiple (AND)
PARDOS filtro = df.query("edad > 28 && salario > 50000");
show(filtro);

-- Filtro múltiple (OR)
PARDOS filtro2 = df.query("ciudad == 'Bogotá' || ciudad == 'Medellín'");
show(filtro2);
```

---

## Soporte de Expresiones en query

El método `query()` acepta expresiones KAFE completas:

| Operador | Uso |
|----------|-----|
| `==` | Igualdad |
| `!=` | Desigualdad |
| `<`, `<=`, `>`, `>=` | Comparación |
| `&&` | AND lógico |
| `\|\|` | OR lógico |

```kafe
-- Comparaciones con strings
PARDOS res = df.query("nombre != 'Alice'");

-- Combinaciones
PARDOS res2 = df.query("(edad > 25 && salario > 40000) || ciudad == 'Bogotá'");
```

---

## Detección de Delimitador

`read_csv` detecta automáticamente el delimitador:

- Si hay más `;` que `,`, usa `;` como delimitador
- De lo contrario, usa `,`

---

## Manejo de Errores

| Error | Causa |
|-------|-------|
| **Archivo no encontrado** | CSV no existe en la ruta especificada |
| **Columna no existe** | Nombre de columna incorrecto en `col`, `query`, etc. |
| **Dimensiones inconsistentes** | Número de columnas no coincide con datos |
| **Tipos incorrectos** | Operación no válida para el tipo de columna |
