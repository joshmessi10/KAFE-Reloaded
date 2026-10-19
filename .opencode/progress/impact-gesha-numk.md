# Impacto: GESHA sobre NUMK sin Tensor propio

Fecha: 2026-09-30. Rol: Architect. Estado: análisis previo; no certifica implementación ni pruebas.

## Theory

Un tensor numérico es una estructura rectangular de escalares; no necesita una clase adicional. NUMK debe ser el propietario de la validación de forma, creación, broadcasting, reducción y operaciones elemento a elemento sobre listas. GESHA conserva exclusivamente estado entrenable, capas y grafo.

Para Dense, `Z = XW + b`, `dW = XᵀdZ`, `db = sum(dZ, eje=0)`, `dX = dZWᵀ`. El coste es O(BIO). La activación debe guardar el vector completo: una caché escalar sobrescrita por cada neurona produce derivadas incorrectas. En Softmax, el producto Jacobiano-vector `P * (G - sum(G*P))` evita materializar el Jacobiano, con coste O(C). Minibatches por acumulación de muestras son correctos si los parámetros permanecen constantes durante el lote y se divide una sola vez por su tamaño real.

## Analysis

Fuentes inspeccionadas: `core.py`, `funciones.py`, `layers.py`, `activations.py`, `models.py`, `optimizers.py`; NUMK `funciones.py` y `utils.py`; conocimiento DL/libraries, ADR-0008/0009, historia de septiembre y progreso actual.

- `core.Tensor` replica validación y envuelve listas; solo lo consumen las cuatro fábricas tensoriales. No aparecen consumidores en tests. El tipo GESHA clasifica Model/Layer/Node/Input, no Tensor.
- Dense aún calcula productos, inicialización y gradientes con bucles propios; sus llamadas escalares a `activation.forward` sobrescriben la caché con la última neurona. Las capas de activación independientes entregan listas a activaciones escalares.
- Flatten duplica shape/flatten/reshape. Add/Dropout, optimizadores y acumulación de minibatches contienen operaciones sobre listas que deben delegarse.
- NUMK ya ofrece dot_matrix, transpose, zeros_nd, ones, random_tensor, reshape, operaciones elementales y broadcasting. `_shape_nd` y `shape` solo inspeccionan la primera rama. Broadcasting actual no expande correctamente todos los casos ND. Faltan utilidades unarias públicas y división con broadcasting; reducciones requieren validación de ejes. Algunos decoradores anuncian solo vectores/matrices pese a cuerpos ND.
- ADR-0008 exige GESHA antes de callable, firmas de predicción y formato de entrenamiento. ADR-0009 conserva contratos históricos pero no obliga a retener Tensor.
- Memoria y progreso aún describen el trabajo de ADR-0008 con estados contradictorios.

## Impact

| Módulo | Cambio y riesgo |
|---|---|
| GESHA/core.py | Eliminar Tensor y tensor_*; conservar Parameter y nodos. Importaciones Python directas a Tensor dejarán de funcionar: ruptura intencional solicitada. |
| GESHA/funciones.py | Conservar nombres tensor/tensor_* como delegaciones NUMK que devuelven listas; dejan de existir `.data`, `.shape`, `.ndim` del wrapper. Documentar migración a listas y numk.shape. |
| NUMK/utils.py y funciones.py | Centralizar validación y operaciones ND; riesgo transversal para MACHINE y otros consumidores de NUMK. No cambiar arbitrariamente retorno tuple de shape ni orden de sumas. |
| GESHA/layers.py y activations.py | Delegar álgebra e inicialización; corregir caché completa y errores de dimensión; preservar firmas y semillas. |
| GESHA/optimizers.py y models.py | Reemplazar recursión numérica con NUMK; preservar identidad de Parameter y estado Adam/SGD. Deduplicar parámetros y construir capas lazy antes de reunir parámetros del lote. |
| TypeUtils/global_utils/despacho | Verificar firmas ND desde KAFE; no añadir tipo tensor ni tocar gramática/parser. Vigilar imports circulares NUMK → TypeUtils → GESHA. |

El cambio del wrapper a listas es autorizado por el pedido explícito de eliminar Tensor; no debe presentarse como compatibilidad Python total. Las fábricas y programas KAFE conservan sus nombres. No se necesitan dependencias externas.

Functional presenta deuda previa: Input no es Node, backward sobrescribe aportes de ramas simples y una capa compartida sobrescribe cachés. Mantener los grafos soportados comprobados; no anunciar soporte general de capas compartidas sin pruebas y solución específica.

## Plan

1. Registrar baseline de suite completa antes de cambios y conservar fixtures AND/OR.
2. Corregir/extender NUMK reutilizando sus funciones: formas rectangulares, operaciones ND unarias y binarias, broadcasting escalar/ND, reducción y reshape. Validar entradas irregulares, formas vacías y ejes negativos/fuera de rango.
3. Eliminar Tensor y helpers de core; convertir fábricas a importaciones/delegaciones NUMK. Comprobar retorno list y llamadas reales KAFE.
4. Sustituir duplicación numérica en capas/optimizadores/modelos por NUMK. Hacer una única llamada de activación por vector; probar Dense de varias salidas.
5. Verificar acumulación de lotes completos/incompletos, construcción lazy, parámetros únicos y normalización única. No exigir vectorización de lotes si la semántica vigente por muestra queda correcta.
6. Ejecutar diferencias finitas, suite completa, cinco escenarios medidos y auditoría de duplicación. Actualizar ADR, documentación, concepto, historia y memoria; solicitar revisión DoD al coordinador.

## Implementation

Contrato recomendado: datos numéricos son escalares/listas rectangulares; NUMK valida estructura y produce resultados sin mutar entradas. Las utilidades tensor_* devuelven listas. `Parameter` conserva `data`, `grad`, `name`; no añade aritmética. Las activaciones mantienen `activate`/`derivative` y el contrato `forward`/`backward`. El gradiente entrante/saliente conserva forma. Dense rechaza dimensiones incompatibles y backward antes de forward.

## Validation

- Pruebas NUMK 0D/1D/2D/3D, broadcasting `[B,C]+[C]`, `[B,C]+[B,1]`, escalar y ejes negativos; irregularidad y tamaños incompatibles fallan explícitamente.
- Diferencias finitas centrales de dW/db/dX con MSE de varias salidas, ReLU lejos de cero y Softmax+CCE. Comparar dZ con `P-Y` para CCE one-hot sin duplicar Jacobiano.
- SGD y Adam con parámetros vectoriales y matriciales; identidad y actualización única.
- Minibatch de tamaño uno contra fixtures exactos; lote parcial y lazy initialization; cambio de pesos verificable.
- Fábricas tensoriales en KAFE con listas ND y tipo GESHA de capas/modelos conservado.
- Benchmarks reproducibles: pequeño, mediano, límite, multiclase y estrés; tiempo/memoria reales, semilla y dimensiones.

## Documentation

Actualizar `docs/bibliotecas/{gesha,numk}.md`, conocimiento DL, concepto tensor/retropropagación, ADR consolidado (retirada explícita del wrapper), historia mensual, benchmarks y memoria/progreso. No afirmar una suite verde hasta ejecutarla.

## Next Steps

El coordinador debe leer este informe antes de implementar; registrar decisión API y asignar propiedad de archivos. Las limitaciones Functional no resueltas deben quedar explícitas en documentación y pruebas.
