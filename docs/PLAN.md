# Plan de Documentación Técnica KAFE

## Framework
- **MkDocs** con tema **Material** para GitHub Pages
- Despliegue automático vía GitHub Actions

## Estructura del Sitio

```
docs/
├── index.md                                        # Portada + introducción
├── guia-inicio/
│   ├── instalacion.md                              # Requisitos, instalación
│   ├── primer-programa.md                          # Hello world, ejecución
│   └── ejemplos-basicos.md                         # Variables, operadores, I/O
├── lenguaje/
│   ├── estructura-lexica.md                        # Comentarios, identificadores, reservados
│   ├── sistema-tipos.md                            # Primitivos, List, FUNC, GESHA, PARDOS, MACHINE
│   ├── operadores.md                               # Aritméticos, comparación, lógicos
│   ├── estructuras-control.md                      # if/elif/else, while, for, range
│   ├── funciones.md                                # drip, currificación, lambdas, closures
│   ├── listas.md                                   # Declaración, índices, built-ins
│   └── importaciones.md                            # Sistema de módulos
├── bibliotecas/
│   ├── numk.md                                     # Álgebra lineal
│   ├── math.md                                     # Funciones matemáticas
│   ├── plot.md                                     # Visualización SVG
│   ├── files.md                                    # E/S de archivos
│   ├── gesha.md                                    # Deep Learning
│   ├── pardos.md                                   # DataFrames / CSV
│   └── machine.md                                  # ML utilities
├── especificacion/
│   ├── gramatica-ebnf.md                           # Gramática formal
│   ├── semantica-operacional.md                    # Big-step semantics
│   ├── analisis-lexico-sintactico-semantico.md     # Pipeline de ejecución
│   └── precedencia-operadores.md                   # Tabla de precedencia
├── errores/
│   ├── tipos-error.md                              # Categorías de errores
│   ├── errores-lexicos.md                          # Errores léxicos
│   ├── errores-sintacticos.md                      # Errores de sintaxis
│   ├── errores-semanticos.md                       # Errores semánticos
│   └── referencia-errores.md                       # Tabla completa
├── ejemplos/
│   ├── hola-mundo.kf
│   ├── fibo-curri.kf
│   ├── merge-sort.kf
│   ├── regresion-lineal.kf
│   └── red-neuronal.kf
└── about/
    ├── creditos.md
    └── licencia.md
```

## Fuentes de Contenido
- `kafe_doc.js` → Migración de §1-13
- `src/Kafe_Lexer.g4` + `Kafe_Grammar.g4` → Gramática EBNF
- `src/errores.py` → Referencia de errores
- `src/lib/KafePARDOS/` → Documentación PARDOS
- `src/lib/KafeMACHINE/` → Documentación MACHINE
- `src/EvalVisitorPrimitivo.py` → Análisis del pipeline de ejecución
