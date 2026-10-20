# Redes neuronales con Gesha: ocho niveles

Estos ocho programas independientes enseñan el flujo completo: crear datos o importarlos de Kaggle, preparar entradas y etiquetas, dividir entrenamiento y prueba cuando hay suficientes muestras, definir capas, compilar, entrenar, predecir y evaluar. Ejecuta cualquiera desde la raíz del repositorio, por ejemplo:

```bash
python src/Kafe.py docs/ejemplos/gesha-nivel-5-iris.kf
```

Los ejemplos de Kaggle requieren conexión en la primera ejecución. Las métricas de conjuntos pequeños son demostraciones educativas, no estimaciones de rendimiento para producción. En niveles 5–8 el escalado, cuando aplica, se ajusta solo con entrenamiento. Las compuertas usan toda la tabla de verdad porque solo hay cuatro combinaciones.

En una ejecución local con las semillas de los archivos: AND, OR y XOR acertaron 4/4; la función cuadrática obtuvo MAE 0,030; Iris alcanzó accuracy 0,967; Breast Cancer Wisconsin, 0,830; y Red Wine Quality, MAE 0,541 puntos. MNIST ejecutó su única época en unos 140 segundos y obtuvo accuracy 0,10 con solo una imagen de entrenamiento por dígito. Esta última cifra muestra el límite del muestreo rápido, no el rendimiento que puede alcanzar una red entrenada con más datos.

| Nivel | Ejercicio y dataset | Arquitectura | Objetivo | Archivo |
|---|---|---|---|---|
| 1 | AND, sin dataset externo | 2 → 1 | Lógica binaria | [AND](gesha/nivel-1.md) |
| 2 | OR, sin dataset externo | 2 → 1 | Clasificación binaria | [OR](gesha/nivel-2.md) |
| 3 | XOR, sin dataset externo | 2 → 4 → 1 | Relaciones no lineales | [XOR](gesha/nivel-3.md) |
| 4 | Función cuadrática, datos generados | 1 → 16 → 16 → 1 | Regresión no lineal | [Función](gesha/nivel-4.md) |
| 5 | [Iris Species](https://www.kaggle.com/datasets/uciml/iris) | 4 → 8 → 3 | Clasificación multiclase | [Iris](gesha/nivel-5.md) |
| 6 | [Breast Cancer Wisconsin](https://www.kaggle.com/datasets/uciml/breast-cancer-wisconsin-data) | 30 → 16 → 8 → 1 | Clasificación binaria experimental | [Breast Cancer](gesha/nivel-6.md) |
| 7 | [Red Wine Quality](https://www.kaggle.com/datasets/uciml/red-wine-quality-cortez-et-al-2009) | 11 → 32 → 16 → 1 | Regresión multivariable | [Wine Quality](gesha/nivel-7.md) |
| 8 | [MNIST en JPG](https://www.kaggle.com/datasets/scolianni/mnistasjpg) | 784 → 128 → 64 → 10 | Clasificación de dígitos | [MNIST](gesha/nivel-8.md) |

Una capa densa calcula \(z = Wx + b\) y aplica una activación. `sigmoid` entrega una probabilidad binaria; `softmax` entrega probabilidades por clase. XOR necesita una capa oculta porque una sola recta no separa sus cuatro casos. En regresión, la salida `linear` conserva el rango continuo y se minimiza el error cuadrático medio. La propagación hacia atrás calcula gradientes y `sgd` o `adam` actualizan los pesos. Para una capa densa de \(n\) entradas y \(m\) neuronas, cada pasada requiere \(O(nm)\) operaciones y \(O(nm)\) parámetros; el nivel MNIST es el más costoso.


## Explorar los niveles

- [Nivel 1 · AND](gesha/nivel-1.md)
- [Nivel 2 · OR](gesha/nivel-2.md)
- [Nivel 3 · XOR](gesha/nivel-3.md)
- [Nivel 4 · Aproximación de funciones](gesha/nivel-4.md)
- [Nivel 5 · Iris Species](gesha/nivel-5.md)
- [Nivel 6 · Breast Cancer Wisconsin](gesha/nivel-6.md)
- [Nivel 7 · Red Wine Quality](gesha/nivel-7.md)
- [Nivel 8 · MNIST](gesha/nivel-8.md)
