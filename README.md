# ☕️ KAFE — Kafe Deep Learning Language

**KAFE** is a domain-specific programming language (DSL) designed to make it easier to learn _deep learning_, functional structures, and symbolic processing. It was created by four computer science and artificial intelligence students at Universidad Sergio Arboleda.

**KAFE** is still under development, and there is more to refine. Contributions from anyone interested in the project are welcome.

> 🍰 "The people who are crazy enough to think they can change the world are the ones who do." Steve Jobs

---

## Key features

- 🧠 Inspired by functional languages
- 🔁 Supports lambda, curried, and higher-order functions
- 🧮 `NUMK` library for NumPy-style linear algebra
- 📊 `PLOT` library for Matplotlib-style visualization
- 🧠 `GESHA` library for neural networks and deep learning
- 🧮 `MATH` library for mathematical utilities
- 📊 `FILES` library for file operations
- 🧠 `PARDOS` library for CSV and DataFrame operations
- 🤖 `MACHINE` library for machine learning models and evaluation metrics
- ⚙️ Built with ANTLR and Python
- 🖥️ Web application with an online compiler
- 🔁 Automated tests

---

## 🤖 Machine Learning (MACHINE)

The `MACHINE` library provides scikit-learn-style ML models and evaluation metrics.

### Models

| Model | Factory | Description |
|--------|---------|-------------|
| **LinearRegression** | `machine.linear_regression()` | Linear regression (normal equation, `coef_`, `intercept_`, `score()`) |
| **LogisticRegression** | `machine.logistic_regression(lr, iter)` | Logistic regression (`predict()`, `predict_proba()`, `score()`) |
| **KNN** | `machine.knn(k)` | K-Nearest Neighbors (`predict()`, `predict_proba()`, `score()`) |
| **DecisionTreeClassifier** | `machine.decision_tree_classifier(criterion, max_depth, min_samples_split, min_samples_leaf)` | Decision tree classifier (Gini/entropy criterion, `fit()`, `predict()`, `score()`) |
| **StandardScaler** | `machine.standard_scaler()` | Z-score standardization (`transform()`, `inverse_transform()`) |
| **MinMaxScaler** | `machine.minmax_scaler()` | Scaling to [0, 1] (`transform()`, `inverse_transform()`) |
| **SimpleImputer** | `machine.simple_imputer(strategy)` | Imputation of missing values (mean/median/most_frequent/constant) |
| **LabelEncoder** | `machine.label_encoder()` | Ordinal label encoding |
| **OneHotEncoder** | `machine.one_hot_encoder()` | One-hot encoding for DataFrames |
| **OrdinalEncoder** | `machine.ordinal_encoder()` | Ordinal encoding of categorical features using a specified order |
| **PCA** | `machine.pca(n)` | Principal component analysis |

### Classification metrics

```kafe
FLOAT acc = machine.accuracy_score(y_true, y_pred);
FLOAT prec = machine.precision_score(y_true, y_pred);
FLOAT rec = machine.recall_score(y_true, y_pred);
FLOAT f1 = machine.f1_score(y_true, y_pred);
List[List[INT]] cm = machine.confusion_matrix(y_true, y_pred);
STR report = machine.classification_report(y_true, y_pred);
```

### Regression metrics

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

## 🛠️ Installation

### ✅ Requirements

- **Python** `>= 3.10`
- **Git**
- **Java JDK** `>= 11` (required for ANTLR)
- **ANTLR 4.13.2**
- **Pytest**

### 📥 Installation

#### Option 1: Manual setup (Windows/Linux/macOS)

1. **Install Java JDK**:
   - Download it from [Oracle](https://www.oracle.com/java/technologies/downloads/)
   - Verify the installation with `java -version`

2. **Install ANTLR 4.13.2**:

   **Windows:**

   a. Download the JAR file:

   ```bash
   curl -O https://www.antlr.org/download/antlr-4.13.2-complete.jar
   ```

   b. Create an ANTLR folder (for example, `C:\Users\YourUser\.antlr\`) and move the JAR there.

   c. Create an `antlr.cmd` file in the same folder with this content:

   ```batch
   @echo off
   java -jar C:\Users\YourUser\.antlr\antlr-4.13.2-complete.jar %*
   ```

   (Replace `YourUser` with your actual user name.)

   d. Add the folder to your PATH:
   - Open **Environment Variables** from the Start menu.
   - Under **User variables**, select **Path** and click **Edit**.
   - Click **New** and add `C:\Users\YourUser\.antlr`.
   - Click **OK** in each dialog.
   - **Restart your terminal or PowerShell.**

   e. Verify the installation:

   ```bash
   antlr
   # The ANTLR help text should appear.
   ```

   **Linux/macOS:**

   ```bash
   # Download the JAR file.
   curl -O https://www.antlr.org/download/antlr-4.13.2-complete.jar

   # Move it to a permanent location.
   sudo mkdir -p /usr/local/lib
   sudo mv antlr-4.13.2-complete.jar /usr/local/lib/

   # Add an alias to ~/.bashrc or ~/.zshrc.
   echo "alias antlr='java -jar /usr/local/lib/antlr-4.13.2-complete.jar'" >> ~/.bashrc

   # Reload the shell profile.
   source ~/.bashrc
   ```

3. **Clone the repository**:

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

### 🚀 Run a program

From the repository root:

```bash
uv run --locked python src/Kafe.py tests/Algorithms/Fibonacci.kf
```

From `src/`, use the project root explicitly:

```bash
uv run --locked --project .. python Kafe.py ../tests/Algorithms/Fibonacci.kf
```

### Run the tests

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

📺 **Video tutorial**

Once everything is installed, watch this video for a visual walkthrough of using **KAFE** from your terminal, running tests, and working with the language.

🔗 [Watch the video tutorial](https://youtu.be/AKCPBTu_CYE)

---

## 📚 Technical documentation

The complete language documentation is available as a website:

🔗 **[KAFE documentation](https://joshmessi10.github.io/KAFE-Reloaded/)**

It includes:

- **Getting started**: Installation, first steps, and basic examples
- **Language reference**: Types, operators, functions, and control flow
- **Libraries**: NUMK, MATH, PLOT, FILES, GeshaDeep, PARDOS, and MACHINE
- **Specification**: EBNF grammar and operational semantics
- **Errors**: Complete error reference
- **Examples**: Progressive sample programs

### Contributing to the documentation

The documentation uses [MkDocs Material](https://squidfunnel.github.io/mkdocs-material/). Install its locked dependency group and serve the site locally:

```bash
uv sync --locked --group docs --no-dev
uv run --locked --group docs --no-dev mkdocs serve
```

The site will be available at `http://127.0.0.1:8000`.

For renamed paths and Python APIs, see the [English migration guide](docs/migration/english-repository-migration.md).
