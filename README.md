# ☕️ KAFE — Kafe Deep Learning Language

**KAFE** es un lenguaje de programación diseñado como un DSL (Domain-Specific Language) para facilitar el aprendizaje de conceptos de _Deep Learning_, estructuras funcionales y procesamiento simbólico. Realizado por 4
Estudiantes de ciencias de la computacion E inteligencia artificial de la Universidad Sergio Arboleda.

**KAFE** sigue en etapa de desarrollo, hay cosas por pulir y arreglar pero toda persona interesada en agregar su granito de Kafe al proyecto es bienvenida.

> 🍰 "The people who are crazy enough to think they can change the world are the ones who do." Steve Jobs

---

## Características principales

- 🧠 Inspirado en lenguajes funcionales
- 🔁 Soporte para funciones lambda, currificación y de alto nivel
- 🧮 Librería `NUMK` tipo NumPy para álgebra lineal
- 📊 Librería `PLOT` tipo Matplotlib para visualización
- 🧠 Librería `KAFE GESHA` Libreria para manejo de redes neuronales y deep learning
- 🧮 Librería `MATH` Libreria de utilidades matematicas
- 📊 Librería `FILES` Libreria para manejo de archivos
- 🧠 Librería `PARDOS` Libreria para manejo de archivos CSV
- 🤖 Librería `MACHINE` Modelos de Machine Learning y métricas de evaluación
- ⚙️ Construido con ANTLR + Python
- 🖥️ Aplicativo WEB (Compilador en linea)
- 🔁 TESTS Automatizados

---

## 🤖 Machine Learning (MACHINE)

La librería `MACHINE` provee modelos de ML con API estilo scikit-learn y métricas de evaluación.

### Modelos

| Modelo | Fábrica | Descripción |
|--------|---------|-------------|
| **LinearRegression** | `machine.linear_regression()` | Regresión lineal (ecuación normal, `coef_`, `intercept_`, `score()`) |
| **LogisticRegression** | `machine.logistic_regression(lr, iter)` | Regresión logística (`predict()`, `predict_proba()`, `score()`) |
| **KNN** | `machine.knn(k)` | K-Nearest Neighbors (`predict()`, `predict_proba()`, `score()`) |
| **DecisionTreeClassifier** | `machine.decision_tree_classifier(criterion, max_depth, min_samples_split, min_samples_leaf)` | Árbol de decisión para clasificación (criterio Gini/Entropy, `fit()`, `predict()`, `score()`) |
| **StandardScaler** | `machine.standard_scaler()` | Estandarización Z-score (`transform()`, `inverse_transform()`) |
| **MinMaxScaler** | `machine.minmax_scaler()` | Escalado a [0,1] (`transform()`, `inverse_transform()`) |
| **SimpleImputer** | `machine.simple_imputer(strategy)` | Imputación de valores faltantes (mean/median/most_frequent/constant) |
| **LabelEncoder** | `machine.label_encoder()` | Codificación ordinal de etiquetas |
| **OneHotEncoder** | `machine.one_hot_encoder()` | Codificación one-hot para DataFrames |
| **OrdinalEncoder** | `machine.ordinal_encoder()` | Codificación ordinal de características categóricas según un orden especificado |
| **PCA** | `machine.pca(n)` | Análisis de Componentes Principales |

### Métricas de Clasificación

```kafe
FLOAT acc = machine.accuracy_score(y_true, y_pred);
FLOAT prec = machine.precision_score(y_true, y_pred);
FLOAT rec = machine.recall_score(y_true, y_pred);
FLOAT f1 = machine.f1_score(y_true, y_pred);
List[List[INT]] cm = machine.confusion_matrix(y_true, y_pred);
STR report = machine.classification_report(y_true, y_pred);
```

### Métricas de Regresión

```kafe
FLOAT mse  = machine.mean_squared_error(y_true, y_pred);
FLOAT mae  = machine.mean_absolute_error(y_true, y_pred);
FLOAT rmse = machine.root_mean_squared_error(y_true, y_pred);
FLOAT r2   = machine.r2_score(y_true, y_pred);
FLOAT me   = machine.max_error(y_true, y_pred);
FLOAT mdae = machine.median_absolute_error(y_true, y_pred);
FLOAT mape = machine.mean_absolute_percentage_error(y_true, y_pred);
FLOAT ev   = machine.explained_variance_score(y_true, y_pred);
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

4. **Install uv** using the [official instructions](https://docs.astral.sh/uv/getting-started/installation/).

5. **Install the locked developer environment** from the repository root:

   ```bash
   uv sync --locked --group dev
   ```

6. **Optional: Enable KafeHF's Hugging Face integration** by installing the extra:

   ```bash
   uv sync --locked --extra huggingface
   ```

7. **⚠️ CRITICAL: Generate the parser files**:

   ```bash
   cd src
   antlr -no-listener -visitor -Dlanguage=Python3 Kafe_Grammar.g4
    # Or with make:
   # make antlr
   cd ..
   ```

    **If you skip this step, KAFE reports**: `ModuleNotFoundError: No module named 'Kafe_GrammarLexer'`

### 🚀 Ejecutar un programa

From the repository root:

```bash
uv run --locked python src/Kafe.py tests/Algorithms/Fibonacci.kf
```

From `src/`, use the project root explicitly:

```bash
uv run --locked --project .. python Kafe.py ../tests/Algorithms/Fibonacci.kf
```

### Run tests

```bash
uv run --locked --group dev pytest tests/
```

### Reproducible environment with **Nix Flake**

The Nix development shell provides system tools, including:

- Python 3.10+
- uv
- OpenJDK (for ANTLR)
- ANTLR 4 generator
- Git

Install the locked Python dependencies after entering the shell with `nix develop`:

#### Use KAFE with Nix

### Install Nix on **Linux**

1. Open a terminal.

2. Run the following command to install Nix:

```bash
curl -L https://nixos.org/nix/install | sh
```

3. After installation, restart the terminal or run:

```bash
. ~/.nix-profile/etc/profile.d/nix.sh
```

4. Enable flakes:

```bash
mkdir -p ~/.config/nix
nano ~/.config/nix/nix.conf
```

Add this setting to the file:

```bash
experimental-features = nix-command flakes
```

### Install Nix on macOS (Intel / Apple Silicon)

1. Open Terminal.

2. Run the following command:

```bash
curl -L https://nixos.org/nix/install | sh
```

3. On Apple Silicon, if you encounter issues, run Terminal with Rosetta or configure the environment for your architecture.

4. Enable flakes as described for Linux.

Once Nix is ready, start the development shell:

```bash
nix develop
```

```bash
uv sync --locked --group dev
```

The uv project supplies the ANTLR runtime and Python developer tools. Generate parser files on a fresh clone as described above.

---

📺 **Tutorial en Video**

Una vez que tengas todo instalado, puedes seguir el siguiente video donde se explica de forma visual y clara cómo usar **KAFE** desde tu terminal, ejecutar pruebas, y trabajar de manera más sencilla y eficiente con el lenguaje.

🔗 [Ver el video tutorial](https://youtu.be/AKCPBTu_CYE)

---

## 📚 Documentación Técnica

La documentación completa del lenguaje está disponible como sitio web:

🔗 **[Documentación de KAFE](https://joshmessi10.github.io/KAFE-Reloaded/)**

Incluye:

- **Guía de Inicio**: Instalación, primeros pasos y ejemplos básicos
- **Referencia del Lenguaje**: Tipos, operadores, funciones, control de flujo
- **Bibliotecas**: NUMK, MATH, PLOT, FILES, GeshaDeep, PARDOS, MACHINE
- **Especificación**: Gramática formal EBNF, semántica operacional
- **Manejo de Errores**: Referencia completa de todos los errores
- **Ejemplos**: Programas de ejemplo progresivos

### Contribuir a la Documentación

The documentation uses [MkDocs Material](https://squidfunnel.github.io/mkdocs-material/). Install its locked dependency group and serve the site locally:

```bash
uv sync --locked --group docs --no-dev
uv run --locked --group docs --no-dev mkdocs serve
```

The site will be available at `http://127.0.0.1:8000`.
