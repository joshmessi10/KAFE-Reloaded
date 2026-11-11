# Datos que faltan

En la vida real los datos tienen **huecos**: un termómetro que se apagó un día, una pregunta que alguien no respondió. En una tabla de PARDOS, un hueco se ve como `nan` (*not a number*, "no es un número"). Antes de entrenar un modelo hay que decidir qué hacer con ellos: **rellenarlos** o **quitar** esas filas.

Todos los ejemplos usan este registro del clima de cinco días (`day` = día, `temp` = temperatura, `rain` = lluvia). Fíjate en las celdas vacías:

```text
--8<-- "tests/DocsExamples/pardos/data/weather.csv"
```

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/pardos-rellenar.svg"
<figcaption>La columna `temp` tiene dos huecos. `ffill` copia el valor de arriba y `bfill` copia el valor de abajo.</figcaption>
</figure>

### `df.fillna(value)` { #fillna }

**Qué hace:** Rellena **todos** los huecos con el mismo valor. Su nombre viene de *fill NaN*, "rellenar los nan".

**Cuándo usarla:** Cuando hay un valor que tiene sentido por defecto, como `0` mm de lluvia.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `value` | `INT | FLOAT | STR` | El valor que se pone en cada hueco. |

**Devuelve:** `PARDOS`: una tabla nueva sin huecos.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/fillna.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/fillna.expec"
```

### `df.dropna()` { #dropna }

**Qué hace:** **Quita** cada fila que tenga al menos un hueco.

**Cuándo usarla:** Cuando tienes muchos datos y perder unas filas no importa.

No recibe parámetros.

**Devuelve:** `PARDOS`: una tabla nueva solo con filas completas.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/dropna.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/dropna.expec"
```

!!! warning
    Aquí se perdieron 3 de 5 filas. Revisa con [`shape`](inspect.md#shape) cuántas filas te quedan.


### `df.ffill()` { #ffill }

**Qué hace:** Rellena cada hueco con el **último valor anterior** de su columna (el de arriba). Su nombre viene de *forward fill*, "rellenar hacia adelante".

**Cuándo usarla:** Con datos ordenados en el tiempo: si ayer hizo 20 °C y hoy no se midió, "igual que ayer" es una buena suposición.

No recibe parámetros.

**Devuelve:** `PARDOS`: una tabla nueva. Un hueco en la primera fila se queda como `nan`, porque no hay nada arriba.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/ffill.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/ffill.expec"
```

### `df.bfill()` { #bfill }

**Qué hace:** Rellena cada hueco con el **siguiente valor** de su columna (el de abajo). Su nombre viene de *backward fill*, "rellenar hacia atrás".

**Cuándo usarla:** Igual que `ffill`, cuando el valor siguiente es mejor pista que el anterior.

No recibe parámetros.

**Devuelve:** `PARDOS`: una tabla nueva. Un hueco en la última fila se queda como `nan`.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/bfill.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/bfill.expec"
```

## ¿Qué aprendiste?

- Un hueco se ve como `nan`.
- `fillna` pone un valor fijo; `ffill` y `bfill` copian el vecino de arriba o de abajo.
- `dropna` quita las filas incompletas.

Volver a [PARDOS](../pardos.md).

[Siguiente: juntar tablas :material-arrow-right:](combine.md){ .md-button .md-button--primary }
