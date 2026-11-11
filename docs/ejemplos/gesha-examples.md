# Ejemplos de GESHA

En esta sección vas a encontrar programas completos de KAFE para construir y entrenar diferentes arquitecturas de redes neuronales con la librería canónica `gesha`. En lugar de seguir niveles rígidos, puedes elegir la arquitectura que prefieras según lo que quieras aprender o resolver.

Si es tu primera vez explorando redes neuronales, te recomendamos leer primero la lección [¿Qué es una neurona?](../aprende/neuronas.md) y el [resumen de GESHA](../libraries/gesha.md).

## Cómo ejecutar los ejemplos { #how-to-run }

Todos los programas `.kf` son completos y se pueden ejecutar directamente desde la terminal en la raíz del repositorio:

```bash
python src/Kafe.py docs/ejemplos/gesha-nivel-1-and.kf
```

!!! note "Datos de Kaggle y Hugging Face"
    La primera vez que ejecutes un ejemplo que usa datos de Kaggle o Hugging Face, necesitarás conexión a internet para descargarlos. En las siguientes ejecuciones, KAFE utilizará la copia guardada en la caché local.

!!! tip "Consejo para preparar datos"
    Cuando trabajes con conjuntos de datos supervisados, divide siempre tus datos en entrenamiento y prueba antes de ajustar el escalador (`scaler`). Así evitas que la información de prueba contamine el entrenamiento.

## Redes densas y perceptrones { #dense-networks }

Las capas densas conectan cada entrada con cada neurona. Son ideales para aprender tablas lógicas, aproximar funciones matemáticas y clasificar datos tabulares o imágenes pequeñas.

| Arquitectura | Datos | Forma | Tarea |
|---|---|---|---|
| [Perceptrón simple: AND](gesha/perceptron-and.md) | Tabla de verdad (en el código) | 2 → 1 | Clasificación binaria lineal |
| [Perceptrón simple: OR](gesha/perceptron-or.md) | Tabla de verdad (en el código) | 2 → 1 | Clasificación binaria lineal |
| [Perceptrón multicapa: XOR](gesha/mlp-xor.md) | Tabla de verdad (en el código) | 2 → 4 → 1 | Clasificación binaria no lineal |
| [Aproximación de función no lineal](gesha/function-approximation.md) | Muestras cuadráticas generadas | 1 → 16 → 16 → 1 | Regresión continua |
| [MLP multiclase: Iris](gesha/iris-mlp.md) | Especies de Iris (Kaggle) | 4 → 8 → 3 | Clasificación multiclase |
| [MLP binario: Cáncer de mama Wisconsin](gesha/breast-cancer-mlp.md) | Breast Cancer Wisconsin (Kaggle) | 30 → 16 → 8 → 1 | Clasificación binaria |
| [MLP de regresión: Calidad de vino tinto](gesha/wine-regression-mlp.md) | Red Wine Quality (Kaggle) | 11 → 32 → 16 → 1 | Regresión multivariable |
| [Clasificador denso: Dígitos MNIST](gesha/mnist-dense-classifier.md) | Dígitos MNIST en imágenes JPG | 784 → 128 → 64 → 10 | Clasificación de imágenes |

## Redes convolucionales, recurrentes y flujos integrados { #workflows }

Estos ejemplos muestran flujos de trabajo más avanzados. Algunos entrenan modelos completos para visión por computadora o procesamiento de secuencias; otros demuestran cómo fluyen los datos en una pasada hacia adelante (*forward pass*) para inspeccionar las formas de los tensores.

| Ejemplo | Datos | Enfoque |
|---|---|---|
| [CNN: CIFAR-10](gesha/cnn-cifar10.md) | Imágenes CIFAR-10 de Kaggle | Descarga imágenes RGB con etiquetas como `[canales, alto, ancho]`, realiza una partición estratificada y entrena un clasificador de dos convoluciones con *pooling* y *softmax*. |
| [CNN: clasificador pequeño de imágenes](gesha/cnn-small.md) | Dos imágenes generadas de 3 × 3 en escala de grises | Construye `Conv2D → Flatten → Dense`, compila con entropía cruzada categórica, entrena con dos imágenes etiquetadas e inspecciona los vectores de probabilidad. |
| [Bloque CNN con convolución depthwise](gesha/cnn-depthwise.md) | Una imagen generada de 4 × 4 | Pasa una imagen con canales al inicio por convolución *depthwise*, normalización por lotes (*batch normalization*), *global average pooling* y una capa densa con *softmax*. |
| [RNN: clasificación de secuencias](gesha/rnn-sequences.md) | Cuatro secuencias binarias generadas | Construye `SimpleRNN → Dense`, entrena sobre secuencias cortas con etiquetas y compara las predicciones. |
| [RNN: pronóstico de temperatura](gesha/rnn-temperature.md) | Temperaturas mínimas diarias en Melbourne (Kaggle) | Crea ventanas de siete días, divide cronológicamente para preservar el orden temporal en la prueba, ajusta el preprocesamiento y predice la temperatura del día siguiente. |
| [Embedding y RNN: análisis de sentimiento](gesha/rnn-sentiment.md) | Frases etiquetadas de Yelp (Kaggle) | Carga texto etiquetado, realiza una partición estratificada, ajusta el tokenizador solo con el texto de entrenamiento y entrena un clasificador recurrente con *embedding*. |
| [LSTM bidireccional: vectores de tokens](gesha/lstm-embedding.md) | Una secuencia de tokens generada | Mapea identificadores de tokens a vectores con `embedding`, procesa con una LSTM bidireccional y entrega el resultado a una capa densa con *sigmoid*. |
| [NUMK y clasificador denso](gesha/numk-dense.md) | Tres vectores numéricos generados | Crea tensores numéricos con NUMK, entrena un clasificador denso e inspecciona las probabilidades predichas. |
| [Autoencoder y K-Means: Iris](gesha/autoencoder-clustering.md) | Características numéricas de Iris (Hugging Face) | Carga cuatro características numéricas, entrena un *autoencoder* `4 → 3 → 2 → 3 → 4`, utiliza el espacio latente de 2 dimensiones como entrada para K-Means de MACHINE y grafica los cúmulos con PLOT. |

??? info "Para curiosos 🤓"
    Una capa densa calcula $z = Wx + b$ y aplica una función de activación a cada salida:
    
    - **Sigmoid** se usa en salidas binarias (produce un valor entre 0 y 1).
    - **Softmax** transforma puntuaciones en probabilidades para problemas multiclase (las salidas suman 1).
    - **Linear** conserva valores numéricos reales para tareas de regresión.
    
    Durante el entrenamiento, la propagación hacia atrás (*backpropagation*) utiliza la regla de la cadena para calcular gradientes y actualizar los pesos. Una capa con $n$ entradas y $m$ neuronas tiene $O(nm)$ pesos y multiplicaciones por cada ejemplo.
    
    Los ejemplos AND, OR y XOR evalúan todas las filas de la tabla de verdad. El clasificador MNIST utiliza intencionalmente un subconjunto reducido para que el ejercicio se ejecute de forma ágil en cualquier máquina educativa, por lo que su exactitud no debe compararse con un entrenamiento exhaustivo de producción.

!!! tip "¿Qué aprendiste?"
    - Puedes armar cualquier red en KAFE combinando capas en `gesha.sequential`.
    - Cada arquitectura responde a un tipo de dato: tablas de verdad y números con capas densas, imágenes con capas convolucionales (CNN) y texto o series temporales con capas recurrentes (RNN y LSTM).
    - Las librerías de KAFE cooperan entre sí: puedes usar PARDOS para leer tablas, NUMK para manipular tensores, GESHA para extraer representaciones profundas, MACHINE para clasificar o agrupar y PLOT para graficar.

## Continuar explorando { #continue }

- [Referencia de la librería GESHA](../libraries/gesha.md)
- [Redes densas y activaciones](../libraries/gesha/dense-networks.md)
- [Redes convolucionales](../libraries/gesha/convolutional-networks.md)
- [Redes recurrentes](../libraries/gesha/recurrent-networks.md)
