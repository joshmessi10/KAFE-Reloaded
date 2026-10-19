# Redes neuronales con GeshaDeep: ocho niveles

Estos ocho programas independientes enseñan el flujo completo: crear datos o importarlos de Kaggle, preparar entradas y etiquetas, dividir entrenamiento y prueba cuando hay suficientes muestras, definir capas, compilar, entrenar, predecir y evaluar. Ejecuta cualquiera desde la raíz del repositorio, por ejemplo:

```bash
python src/Kafe.py docs/ejemplos/gesha-nivel-5-iris.kf
```

Los ejemplos de Kaggle requieren conexión en la primera ejecución. Las métricas de conjuntos pequeños son demostraciones educativas, no estimaciones de rendimiento para producción. En niveles 5–8 el escalado, cuando aplica, se ajusta solo con entrenamiento. Las compuertas usan toda la tabla de verdad porque solo hay cuatro combinaciones.

En una ejecución local con las semillas de los archivos: AND, OR y XOR acertaron 4/4; la función cuadrática obtuvo MAE 0,030; Iris alcanzó accuracy 0,967; Breast Cancer Wisconsin, 0,830; y Red Wine Quality, MAE 0,541 puntos. MNIST ejecutó su única época en unos 140 segundos y obtuvo accuracy 0,10 con solo una imagen de entrenamiento por dígito. Esta última cifra muestra el límite del muestreo rápido, no el rendimiento que puede alcanzar una red entrenada con más datos.

| Nivel | Ejercicio y dataset | Arquitectura | Objetivo | Archivo |
|---|---|---|---|---|
| 1 | AND, sin dataset externo | 2 → 1 | Lógica binaria | [AND](gesha-nivel-1-and.kf) |
| 2 | OR, sin dataset externo | 2 → 1 | Clasificación binaria | [OR](gesha-nivel-2-or.kf) |
| 3 | XOR, sin dataset externo | 2 → 4 → 1 | Relaciones no lineales | [XOR](gesha-nivel-3-xor.kf) |
| 4 | Función cuadrática, datos generados | 1 → 16 → 16 → 1 | Regresión no lineal | [Función](gesha-nivel-4-funcion.kf) |
| 5 | [Iris Species](https://www.kaggle.com/datasets/uciml/iris) | 4 → 8 → 3 | Clasificación multiclase | [Iris](gesha-nivel-5-iris.kf) |
| 6 | [Breast Cancer Wisconsin](https://www.kaggle.com/datasets/uciml/breast-cancer-wisconsin-data) | 30 → 16 → 8 → 1 | Clasificación binaria experimental | [Breast Cancer](gesha-nivel-6-breast-cancer.kf) |
| 7 | [Red Wine Quality](https://www.kaggle.com/datasets/uciml/red-wine-quality-cortez-et-al-2009) | 11 → 32 → 16 → 1 | Regresión multivariable | [Wine Quality](gesha-nivel-7-wine.kf) |
| 8 | [MNIST en JPG](https://www.kaggle.com/datasets/scolianni/mnistasjpg) | 784 → 128 → 64 → 10 | Clasificación de dígitos | [MNIST](gesha-nivel-8-mnist.kf) |

Una capa densa calcula \(z = Wx + b\) y aplica una activación. `sigmoid` entrega una probabilidad binaria; `softmax` entrega probabilidades por clase. XOR necesita una capa oculta porque una sola recta no separa sus cuatro casos. En regresión, la salida `linear` conserva el rango continuo y se minimiza el error cuadrático medio. La propagación hacia atrás calcula gradientes y `sgd` o `adam` actualizan los pesos. Para una capa densa de \(n\) entradas y \(m\) neuronas, cada pasada requiere \(O(nm)\) operaciones y \(O(nm)\) parámetros; el nivel MNIST es el más costoso.

## Nivel 1 · AND

```kafe
--8<-- "docs/ejemplos/gesha-nivel-1-and.kf"
```

## Nivel 2 · OR

```kafe
--8<-- "docs/ejemplos/gesha-nivel-2-or.kf"
```

## Nivel 3 · XOR

```kafe
--8<-- "docs/ejemplos/gesha-nivel-3-xor.kf"
```

## Nivel 4 · Aproximación de funciones

```kafe
--8<-- "docs/ejemplos/gesha-nivel-4-funcion.kf"
```

## Nivel 5 · Iris Species

Las cuatro medidas de sépalos y pétalos se estandarizan. La etiqueta es un entero entre 0 y 2 y la pérdida es `sparse_categorical_crossentropy`.

```kafe
--8<-- "docs/ejemplos/gesha-nivel-5-iris.kf"
```

## Nivel 6 · Breast Cancer Wisconsin

Se usan las 30 medidas, excluyendo `id`, `diagnosis` y la columna vacía. `B=0`, `M=1`. Es una demostración de código, no una herramienta de diagnóstico.

```kafe
--8<-- "docs/ejemplos/gesha-nivel-6-breast-cancer.kf"
```

## Nivel 7 · Red Wine Quality

La calidad se transforma a `(quality - 3) / 5` para entrenar y se revierte al evaluar el error absoluto en puntos de calidad.

```kafe
--8<-- "docs/ejemplos/gesha-nivel-7-wine.kf"
```

## Nivel 8 · MNIST

KafeKAGGLE lee imágenes JPG de 28×28 en escala de grises y devuelve píxeles en `[0,1]`. El programa aplana cada imagen a 784 entradas. Este dataset también trae 600 imágenes duplicadas en la raíz de `trainingSample` sin etiqueta; el ejemplo selecciona únicamente carpetas `0` a `9`. Para mantener el tiempo de ejecución razonable usa dos imágenes por dígito y una época, con una imagen de cada clase para entrenamiento y otra para prueba. Es una comprobación funcional de la arquitectura: la accuracy puede ser baja y no estima su potencial. Amplía el muestreo y las épocas para entrenar un clasificador más serio.

```kafe
--8<-- "docs/ejemplos/gesha-nivel-8-mnist.kf"
```
