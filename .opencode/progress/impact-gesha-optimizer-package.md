# Impact Analysis — paquete de optimizadores GESHA

## Alcance

Reemplazar el módulo monolítico `optimizers.py` por un paquete donde cada optimizador tenga su propio archivo.

## Módulos afectados

- `KafeGESHA/optimizers/`: contrato base, SGD, RMSprop, Adam y AdamW.
- Documentación de arquitectura, estado, ADR e historial.

## Compatibilidad y riesgos

El `__init__.py` conserva `from lib.KafeGESHA.optimizers import SGD, RMSprop, Adam, AdamW`, por lo que `models.py` y consumidores externos no cambian. El riesgo consiste en perder el estado por parámetro o alterar el orden de AdamW; se verifica con las pruebas existentes de actualizaciones, momentos y entrenamiento.

## Plan de validación

Compilar el paquete, ejecutar las pruebas de backend GESHA y programas del intérprete, comprobar imports residuales y validar el diff.
