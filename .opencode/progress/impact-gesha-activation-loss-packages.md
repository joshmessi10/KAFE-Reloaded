# Impact Analysis — paquetes de activaciones y pérdidas

## Alcance

Separar los módulos monolíticos `activations.py` y `losses.py` en paquetes con un archivo por componente, y retirar el adaptador redundante `advanced_layers.py`.

## Impacto y compatibilidad

- Las importaciones públicas `lib.KafeGESHA.activations` y `lib.KafeGESHA.losses` se conservan mediante los `__init__.py`.
- Las capas avanzadas se importan desde `lib.KafeGESHA.layers`, que ya es su fuente canónica.
- No cambian fórmulas, nombres, firmas, estado serializado ni gramática.

## Riesgos y verificación

El riesgo principal son imports circulares o símbolos omitidos. Se controla compilando todos los módulos, importando cada símbolo histórico y ejecutando las pruebas de backend, capas y programas KAFE.
