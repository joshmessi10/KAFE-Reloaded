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

La documentación está construida con [MkDocs Material](https://squidfunnel.github.io/mkdocs-material/). Para desarrollar localmente:

```bash
pip install mkdocs mkdocs-material pymdown-extensions
mkdocs serve
```

El sitio estará disponible en `http://127.0.0.1:8000`.
