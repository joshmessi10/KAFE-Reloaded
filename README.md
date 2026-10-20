# ☕️ KAFE — Kafe Deep Learning Language

KAFE es un lenguaje de programación diseñado como un DSL (Domain-Specific Language) para facilitar el aprendizaje de conceptos de Deep Learning, programación funcional y procesamiento simbólico.

El proyecto fue desarrollado inicialmente por estudiantes de Ciencias de la Computación e Inteligencia Artificial de la Universidad Sergio Arboleda.

# 🎉 Estado del proyecto — KAFE DSL 2.0

KAFE DSL ha completado oficialmente su etapa principal de desarrollo. La versión 2.0 consolida las funcionalidades fundamentales del lenguaje y su ecosistema de bibliotecas para programación, Machine Learning y Deep Learning.

Aunque el desarrollo de las funcionalidades previstas ha finalizado, el proyecto permanece abierto a mantenimiento, corrección de errores, optimizaciones y futuras contribuciones de la comunidad. ☕

☕ ¡Las contribuciones siguen siendo bienvenidas! Invitamos a estudiantes, desarrolladores y entusiastas de la programación y la inteligencia artificial a aportar ideas, reportar problemas y contribuir al crecimiento del proyecto.

> 🍰 "The people who are crazy enough to think they can change the world are the ones who do." Steve Jobs

---

## 📚 Documentación Técnica

La documentación completa del lenguaje está disponible como sitio web:

🔗 **[Documentación de KAFE](https://joshmessi10.github.io/KAFE-Reloaded/)**

Incluye:

- **Guía de Inicio**: Instalación, primeros pasos y ejemplos básicos
- **Referencia del Lenguaje**: Tipos, operadores, funciones, control de flujo
- **Bibliotecas**: NUMK, MATH, PLOT, FILES, Gesha, PARDOS, MACHINE
- **Especificación**: Gramática formal EBNF, semántica operacional
- **Manejo de Errores**: Referencia completa de todos los errores
- **Ejemplos**: Programas de ejemplo progresivos

---

## Características principales

- 🧠 Inspirado en lenguajes funcionales
- 🔁 Soporte para funciones lambda, currificación y de alto nivel
- 🧮 Librería `NUMK` tipo NumPy para álgebra lineal
- 📊 Librería `PLOT` tipo Matplotlib para visualización
- 🧮 Librería `MATH` Libreria de utilidades matematicas
- 📊 Librería `FILES` Libreria para manejo de archivos
- 🤖 Librería `MACHINE` Modelos de Machine Learning y métricas de evaluación
- 🧠 Librería `GESHA` Redes neuronales y Deep Learning
- 📁 Librería `KAGGLE` Ingesta de datasets desde Kaggle
- 🤗 Librería `HF` Datasets desde Hugging Face
- 📊 Librería `PARDOS` Libreria para manejo de DataFrames y CSV
- ⚙️ Construido con ANTLR + Python
- 🖥️ Aplicativo WEB (Compilador en linea)
- ✅ KAFE DSL 2.0 — Desarrollo principal finalizado, con un ecosistema de bibliotecas para programación, Machine Learning y Deep Learning.
- 🔁 TESTS Automatizados

---

## 🤖 Nuevas Librerías

KAFE v2.0 integra **5 librerías** para un flujo completo de Machine Learning y Deep Learning: **KafeMACHINE** (modelos de ML), **KafeGESHA** (redes neuronales / Deep Learning), **KafeKaggle** (ingesta de datasets desde Kaggle), **KafeHF** (datasets desde Hugging Face) y **KafePARDOS** (manejo de DataFrames / CSV).

Estas bibliotecas forman parte del conjunto de funcionalidades implementadas durante la etapa principal de desarrollo de KAFE DSL 2.0.

### Modelos

- **Lineales / regresión**: `linear_regression`, `ridge_regression` (L2), `lasso_regression` (L1), `elastic_net` (L1+L2), `svr`
- **Clasificación**: `logistic_regression`, `knn`, `svm`, `decision_tree_classifier`, `random_forest_classifier`, `gaussian_nb`, `ada_boost_classifier`, `gradient_boosting_classifier`
- **Regresores**: `knn_regressor`, `decision_tree_regressor`, `random_forest_regressor`, `gradient_boosting_regressor`
- **Clustering**: `kmeans`, `dbscan`, `agglomerative_clustering`, `gaussian_mixture`
- **Reducción de dimensionalidad / discriminantes**: `pca`, `linear_discriminant_analysis`

Todos se obtienen como fábricas `machine.<nombre>(...)` y comparten la API común `fit()`, `predict()`, `predict_proba()` (donde aplica) y `score()`.

### Preprocesamiento

- **Escalado**: `standard_scaler` (Z-score), `minmax_scaler` ([0,1]), `robust_scaler` (por cuantiles)
- **Valores faltantes**: `simple_imputer` (mean / median / most_frequent / constant)
- **Codificación de categorías**: `label_encoder`, `one_hot_encoder`, `ordinal_encoder`
- **Ingeniería de características**: `polynomial_features`, `variance_threshold`, `recursive_feature_elimination`
- **Texto**: `tokenizer`

### Selección de modelos e hiperparámetros

`train_test_split`, `stratified_train_test_split`, `k_fold`, `cross_val_score`, `grid_search_cv`, `randomized_search_cv` y `pipeline` (encadena preprocesamiento + modelo evitando data leakage).

### Métricas

- **Clasificación**: `accuracy_score`, `precision_score`, `recall_score`, `f1_score`, `confusion_matrix`, `classification_report`, `roc_auc_score`
- **Regresión**: `mean_squared_error`, `mean_absolute_error`, `root_mean_squared_error`, `r2_score`, `max_error`, `median_absolute_error`, `mean_absolute_percentage_error`, `explained_variance_score`
- **Clustering**: `silhouette_score`

```kafe
import machine;

List[List[FLOAT]] X = [[1.0], [2.0], [3.0], [4.0], [5.0]];
List[FLOAT] y = [3.0, 5.0, 7.0, 9.0, 11.0];

MACHINE scaler = machine.standard_scaler();
MACHINE model = machine.linear_regression();
MACHINE pipe = machine.pipeline("scaler", scaler, "model", model);

pipe.fit(X, y);
show(machine.r2_score(y, pipe.predict(X)));
```

---

## 🧠 Deep Learning (KafeGESHA)

La librería `gesha` implementa redes neuronales **from scratch** sobre `NUMK`: propagación hacia atrás (backprop) manual, sin TensorFlow ni PyTorch.

### Modelos

- **Sequential**: modelo lineal, capas en orden (`gesha.sequential([...])`).
- **Functional**: grafos con conexiones arbitrarias mediante `gesha.input_layer(...)` (nodo `InputNode`) y `layer.connect(...)` (`gesha.functional(entradas, salidas)`).

### Capas

- **Core / densas**: `Dense`, `ActivationLayer`, `Flatten`
- **Convolucionales**: `Conv1D`, `Conv2D`, `Conv2DTranspose`, `DepthwiseConv2D`
- **Pooling**: `MaxPooling1D`, `MaxPooling2D`, `AveragePooling2D`, `GlobalAveragePooling2D`, `GlobalMaxPooling2D`
- **Normalización**: `BatchNormalization`
- **Espaciales**: `ZeroPadding2D`, `UpSampling2D`, `Reshape`, `Permute`
- **Merge**: `Add`, `Concatenate`, `Multiply`
- **Regularización**: `Dropout`, `SpatialDropout2D`
- **Recurrentes**: `SimpleRNN`, `LSTM`, `GRU`, `Bidirectional`, `Embedding`

### Activaciones

`Linear`, `ReLU`, `Sigmoid`, `Tanh`, `Softmax`, `Step`.

### Funciones de pérdida

`MeanSquaredError`, `MeanAbsoluteError`, `BinaryCrossEntropy`, `CategoricalCrossEntropy`, `SparseCategoricalCrossEntropy`.

### Optimizadores

`SGD`, `Adam`, `RMSprop`, `AdamW`.

### Inicialización, regularización y callbacks

- **Inicializadores (10)**: `Zeros`, `Ones`, `RandomUniform`, `RandomNormal`, `GlorotUniform`, `GlorotNormal`, `HeUniform`, `HeNormal`, `Orthogonal`, `Constant`
- **Regularizadores**: `L1`, `L2`, `L1L2`
- **Callbacks**: `EarlyStopping` (detiene el entrenamiento sin mejora y puede restaurar los mejores pesos) y `ModelCheckpoint` (guarda el mejor modelo según una métrica monitoreada).

```kafe
import gesha;

GESHA oculta = gesha.create_dense(16, "relu", [8], 0.0, 42, gesha.glorot_uniform(42));
GESHA salida = gesha.create_dense(1, "sigmoid", [16], 0.0, 42, gesha.glorot_uniform(42));

GESHA modelo = gesha.sequential([oculta, salida]);
modelo.compile("adam", "bce", []);
modelo.add_callback(gesha.early_stopping("val_loss", 5));
modelo.fit(X, y, 100, 8);

List[INT] pred = modelo.predict_label(X);
```

---

## 🛠️ Instalación

### ✅ Requisitos

- **Python** `>= 3.10`
- **Git**
- **Java JDK** `>= 11` (requerido para ANTLR)
- **ANTLR 4.13.2**
- **Pytest**

### 📥 Instalación

#### Opción 1: Instalación Manual (Windows/Linux/macOS)

1. **Instala Java JDK**:
   - Descarga desde [Oracle](https://www.oracle.com/java/technologies/downloads/)
   - Verifica la instalación: `java -version`

2. **Instala ANTLR 4.13.2**:

   **Windows:**

   a. Descarga el archivo JAR:

   ```bash
   curl -O https://www.antlr.org/download/antlr-4.13.2-complete.jar
   ```

   b. Crea una carpeta para ANTLR (ejemplo: `C:\Users\TuUsuario\.antlr\`) y mueve el JAR ahí

   c. Crea un archivo `antlr.cmd` en esa misma carpeta con el siguiente contenido:

   ```batch
   @echo off
   java -jar C:\Users\TuUsuario\.antlr\antlr-4.13.2-complete.jar %*
   ```

   (Reemplaza `TuUsuario` con tu nombre de usuario real)

   d. Agrega la carpeta a tu PATH:
   - Abre "Variables de entorno" (busca en el menú inicio)
   - En "Variables de usuario", selecciona "Path" y haz clic en "Editar"
   - Haz clic en "Nuevo" y agrega: `C:\Users\TuUsuario\.antlr`
   - Haz clic en "OK" en todas las ventanas
   - **Reinicia tu terminal/PowerShell**

   e. Verifica la instalación:

   ```bash
   antlr
   # Deberías ver la ayuda de ANTLR
   ```

   **Linux/macOS:**

   ```bash
   # Descarga el archivo JAR
   curl -O https://www.antlr.org/download/antlr-4.13.2-complete.jar

   # Mueve a una ubicación permanente
   sudo mkdir -p /usr/local/lib
   sudo mv antlr-4.13.2-complete.jar /usr/local/lib/

   # Agrega alias a ~/.bashrc o ~/.zshrc
   echo "alias antlr='java -jar /usr/local/lib/antlr-4.13.2-complete.jar'" >> ~/.bashrc

   # Recarga el perfil
   source ~/.bashrc
   ```

3. **Clona el repositorio**:

   ```bash
   git clone https://github.com/joshmessi10/KAFE-Reloaded.git
   cd KAFE-Reloaded
   ```

4. **Crea un entorno virtual**:

   ```bash
   python -m venv .venv
   ```

5. **Activa el entorno virtual**:

   ```bash
   # Windows
   .venv\Scripts\activate

   # Linux/macOS
   source .venv/bin/activate
   ```

6. **Instala las dependencias de Python**:

   ```bash
   pip install -r requirements.txt
   ```

7. **⚠️ CRÍTICO: Genera los archivos del parser**:

   ```bash
   cd src
   antlr -no-listener -visitor -Dlanguage=Python3 Kafe_Grammar.g4
   # O con make:
   # make antlr
   cd ..
   ```

   **Sin este paso, obtendrás el error**: `ModuleNotFoundError: No module named 'Kafe_GrammarLexer'`

### 🚀 Ejecutar un programa

Desde el directorio raíz del proyecto:

```bash
python src/Kafe.py tests/Algorithms/Fibonacci.kf
```

O desde cualquier ubicación usando rutas absolutas o relativas:

```bash
# Ejemplo con ruta relativa
cd src
python Kafe.py ../tests/Algorithms/Fibonacci.kf

# Ejemplo con ruta absoluta
python src/Kafe.py C:/ruta/completa/a/tu/programa.kf
```

### 🧪 Ejecutar tests

```bash
pytest tests/
```

### 🧪 Opción alternativa: Entorno reproducible con **Nix Flake** (Recomendado)

Si prefieres evitar instalar dependencias manualmente, puedes utilizar nuestro entorno preconfigurado con **Nix Flake**. Este entorno contiene todas las herramientas necesarias para compilar y ejecutar KAFE, incluyendo:

- Python 3.10+
- ANTLR 4 runtime
- OpenJDK (para ANTLR)
- Git
- Pytest

**Ventaja**: No necesitas instalar Java ni ANTLR manualmente, todo está preconfigurado.

#### 🚀 Usar KAFE con Nix

### 🐧 Instalación de Nix en **Linux**

1. Abre tu terminal.

2. Ejecuta el siguiente comando para instalar Nix:

```bash
curl -L https://nixos.org/nix/install | sh
```

3.Una vez instalado, reinicia tu terminal o ejecuta:

```bash
. ~/.nix-profile/etc/profile.d/nix.sh
```

4. Habilita los flakes:

```bash
mkdir -p ~/.config/nix
nano ~/.config/nix/nix.conf
```

Y dentro del archivo activa lo siguiente :

```bash
experimental-features = nix-command flakes
```

### 🍎 Instalación de Nix en macOS (Intel / Apple Silicon)

1. Abre la aplicación Terminal.

2. Ejecuta el siguiente comando:

```bash
curl -L https://nixos.org/nix/install | sh
```

3. En Apple Silicon (M1/M2/M3), si encuentras problemas, puedes ejecutar Terminal usando Rosetta o configurar el entorno adecuadamente para tu arquitectura.

4. Activa flakes igual que en Linux

✅ Una vez Nix esté listo, puedes iniciar el entorno de desarrollo con:

```bash
nix develop
```

Esto te dará acceso a todas las herramientas necesarias. Los archivos del parser se generarán automáticamente o estarán disponibles.

---

📺 **Tutorial en Video**

Una vez que tengas todo instalado, puedes seguir el siguiente video donde se explica de forma visual y clara cómo usar **KAFE** desde tu terminal, ejecutar pruebas, y trabajar de manera más sencilla y eficiente con el lenguaje.

🔗 [Ver el video tutorial](https://youtu.be/AKCPBTu_CYE)

---

### Contribuir a la Documentación

La documentación está construida con [MkDocs Material](https://squidfunnel.github.io/mkdocs-material/). Para desarrollar localmente:

```bash
pip install mkdocs mkdocs-material pymdown-extensions
mkdocs serve
```

---

# 👨‍💻 Autores y colaboradores

## ☕ Autores

- 🧠 Karen Castañeda

- 🚀 Josh López

- ⚡ Franklin González

### 🤝 Coautores

- Luis Felipe Valencia

- Emanuel Molina

- Andrés Sindicué
