# Tipos de Error

KAFE maneja errores en diferentes fases de la ejecución. Todos los errores incluyen un tipo, un mensaje descriptivo y la ubicación cuando es posible.

---

## Categorías de Errores

| Categoría | Fase | Ejemplo |
|-----------|------|---------|
| **SyntaxError** | Análisis léxico/sintáctico | Token no reconocido, estructura inválida |
| **TypeError** | Ejecución (semántico) | Tipo de dato incorrecto |
| **NameError** | Ejecución (semántico) | Variable o función no definida |
| **IndexError** | Ejecución (runtime) | Índice fuera de rango |
| **RuntimeError** | Ejecución (runtime) | Bucle infinito, error general |
| **FileNotFoundError** | Ejecución (runtime) | Archivo o módulo no encontrado |
| **FileExistsError** | Ejecución (runtime) | Archivo ya existe |

---

## Formato de Error

```
TipoError: mensaje descriptivo
```

Ejemplos:

```
TypeError: Expected INT, obtained FLOAT
NameError: Variable 'x' not defined
IndexError: Index 5 out of bounds for collection of size 3
RuntimeError: Maximum number of iterations exceeded in while loop
```

---

## Errores por Fase

### Fase Léxica

| Error | Descripción |
|-------|-------------|
| Token no reconocido | Carácter inválido en el código |
| String sin cerrar | Falta comilla de cierre |
| Secuencia de escape inválida | `\q`, `\u`, etc. |

### Fase Sintáctica

| Error | Descripción |
|-------|-------------|
| Estructura inválida | `INT = 5;` (falta identificador) |
| Falta `:` o `;` | Bloque sin delimitador |
| Paréntesis sin cerrar | `show((5 + 3;` |

### Fase de Ejecución

| Error | Descripción |
|-------|-------------|
| Tipo incorrecto | Asignar FLOAT a INT |
| Variable no definida | Usar `x` sin declararla |
| Función no definida | Llamar función que no existe |
| Argumentos incorrectos | Número o tipo de argumentos incorrecto |
| Índice fuera de rango | Acceder a posición inexistente |
| Bucle infinito | Más de 10,000 iteraciones en while |

---

## Estrategia de Manejo

KAFE distingue entre:

- **Archivos `.error.kf`**: Errores esperados en tests → exit code 1, stderr
- **Programas normales**: Errores inesperados → stdout, exit code 0

```python
# En Kafe.py
try:
    main()
except Exception as e:
    if ".error.kf" in sys.argv[1]:
        print(error_msg, file=sys.stderr)
        sys.exit(1)
    else:
        print(error_msg)
        sys.exit(0)
```
