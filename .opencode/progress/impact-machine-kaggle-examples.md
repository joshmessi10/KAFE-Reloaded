# Impacto: ejemplos KafeKAGGLE + KafeMACHINE

Fecha: 2026-10-18.

## Estado previo

KafeKAGGLE ya importaba CSV de los cinco datasets públicos y KafeMACHINE ya exponía los 18 algoritmos. Faltaban flujos completos que enlazaran ingesta, selección de variables, split, preprocesamiento, ajuste y evaluación. Al ejecutar Salary Data y Red Wine Quality se detectó que `train_test_split` devolvía una lista heterogénea, rechazada por el sistema de tipos de KAFE; la variante estratificada ya devolvía `TrainTestSplit`.

## Alcance e impacto

- `docs/ejemplos/` y `mkdocs.yml`: 18 programas independientes (un algoritmo y un dataset por archivo) y una página que muestra los 18 pares algoritmo/dataset con el código íntegro. K-Means genera un SVG de Mall Customers versionado.
- `src/lib/KafeMACHINE/model_selection/model_selection.py`: `train_test_split` ahora retorna el contenedor indexable `TrainTestSplit`. Las posiciones `[0..3]` y el orden de partición se conservan; declarar el resultado como `MACHINE` en KAFE ahora funciona.
- `tests/KafeMACHINE/model_selection/`: fixture de regresión que asigna el retorno a `MACHINE`.
- `docs/bibliotecas/`, concepto train-test-split, ADR e historia: contrato y ejemplos actualizados.

## Riesgos y compatibilidad

Los consumidores KAFE que solo usan `split[0..3]` mantienen el mismo orden. El tipo Python ya no es `list`; consumidores Python que comprueben `isinstance(result, list)` deben usar el protocolo de indexación. No se cambian las firmas ni la aleatoriedad. Los cinco ejemplos descargan datasets externos al ejecutarse; las pruebas automáticas de la función usan datos locales.

## Plan de verificación

1. Confirmar encabezados de los cinco CSV públicos y seleccionar columnas sin identificadores.
2. Ejecutar los 18 programas con el intérprete KAFE; inspeccionar la salida porque los errores de ejecución de programas válidos pueden salir por stdout con código 0.
3. Ejecutar el fixture y la suite KafeMACHINE.
4. Compilar MkDocs y verificar que los snippets, enlaces y SVG aparecen en el HTML generado.
