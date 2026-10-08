# Impacto: Conv2D y SimpleRNN en KafeGESHA

## Alcance

Se agregan dos capas entrenables a la jerarquía `Layer`: `Conv2D` para imágenes
CHW y `SimpleRNN` para secuencias `[timesteps, features]`. Se mantienen `Gesha`,
`Sequential`, `Functional`, optimizadores y pérdidas existentes.

## Módulos afectados

- `KafeNUMK`: primitivas de convolución directa e inversa.
- `KafeGESHA.layers`: estado, forward/backward y parámetros de las capas.
- `KafeGESHA.funciones`: fábricas públicas KAFE.
- Pruebas, ejemplos, conceptos, benchmarks y documentación.

## Compatibilidad y riesgos

Las APIs existentes no cambian. Conv2D adopta exclusivamente formato CHW para
evitar ambigüedad. SimpleRNN usa BPTT completo, cuyo costo crece linealmente con
la longitud de secuencia y puede sufrir gradientes que desaparecen o explotan.
La implementación educativa usa bucles NUMK y no pretende rendimiento de GPU.

## Verificación

Forward con valores conocidos, formas `valid/same`, gradientes, actualización
por optimizador, secuencias completas/último estado, argumentos inválidos,
fixtures KAFE, suite completa y cinco escenarios de benchmark por componente.
