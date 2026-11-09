# Guía de estilo de la documentación

Esta guía dice **cómo escribimos** la documentación de KAFE. La meta es que una persona que nunca ha programado pueda leer cualquier página y entenderla.

## El tono

- Frases cortas. Una idea por frase.
- Hablamos de **tú** a quien lee: "ahora escribe…", "vas a ver…".
- No damos nada por sabido. Si usamos una palabra nueva, la explicamos la primera vez.
- Celebramos el avance: cada sección termina con lo que la persona ya sabe hacer.
- Evitamos palabras como "simplemente", "obviamente" o "es trivial". Lo que es obvio para quien escribe no lo es para quien aprende.

## Cómo se explica un concepto

Cada concepto sigue siempre este orden:

1. **La idea en una frase.** Qué es, sin tecnicismos.
2. **Una comparación de la vida diaria.** Una receta, cajas con etiqueta, una licuadora…
3. **Un dibujo o diagrama**, cuando ayuda a ver la idea.
4. **Un ejemplo de KAFE pequeño que se puede ejecutar.** Siempre se prueba antes de publicarlo.
5. **La salida esperada**, en un bloque `text`.
6. **"¿Qué pasó aquí?"**: explicación del ejemplo, paso a paso.
7. **"¿Qué aprendiste?"**: un resumen de dos o tres puntos.

Las fórmulas y los detalles matemáticos van **después** de la intuición, dentro de un bloque plegable:

```markdown
??? info "Para curiosos 🤓"
    La salida de una neurona es $y = f(w \cdot x + b)$.
```

## Plantilla para documentar una función de librería

Cada función de cada librería se documenta con esta plantilla:

```markdown
### `nombre_funcion(param1, param2)`

**Qué hace:** una frase sencilla.

**Cuándo usarla:** un caso real en el que sirve.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `param1` | `FLOAT` | … |

**Devuelve:** el tipo y qué representa.

**Ejemplo:** (programa KAFE ejecutable)

**Resultado:** (salida exacta)

**Errores comunes:** qué pasa si te equivocas y cómo arreglarlo.
```

## Cajas de ayuda

| Caja | Para qué |
|---|---|
| `!!! tip` | Un consejo útil o un atajo. |
| `!!! note` | Un dato extra que no es imprescindible. |
| `!!! warning` | Algo que suele salir mal. |
| `??? info "Para curiosos 🤓"` | Matemáticas y detalles opcionales. |
| `!!! soon "Próximamente"` | Páginas que todavía se están escribiendo. |

## Idiomas

- Cada página existe en español (`pagina.md`) y en inglés (`pagina.en.md`).
- Si todavía no hay traducción, el sitio muestra la versión existente.
- El código de KAFE, los nombres de funciones y los tipos no se traducen. Los nombres de variables de los ejemplos sí pueden traducirse.
