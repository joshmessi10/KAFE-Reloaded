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
- ⚙️ Construido con ANTLR + Python
- 🖥️ Aplicativo WEB (Compilador en linea)
- 🔁 TESTS Automatizados

---

## 🛠️ Instalación

### ✅ Requisitos

- **Python** `>= 3.10`
- **Git**

### 📥 Instalación

1. Clona el repositorio:

```bash
git clone https://github.com/pipe2711/KAFE.git
cd KAFE
```

2. Crea un entorno virtual e instala las dependencias:

```bash
python -m venv .venv
```

3. Activa el entorno virtual:

```bash
# Windows
.venv\Scripts\activate

# Linux/macOS
source .venv/bin/activate
```

4. Instala las dependencias:

```bash
pip install -r requirements.txt
```

### 🚀 Ejecutar un programa

```bash
python src/Kafe.py tests/Algorithms/Fibonacci.kf
```

### 🧪 Ejecutar tests

```bash
pytest tests/
```

📺 **Tutorial en Video**

Una vez que tengas todo instalado, puedes seguir el siguiente video donde se explica de forma visual y clara cómo usar **KAFE** desde tu terminal, ejecutar pruebas, y trabajar de manera más sencilla y eficiente con el lenguaje.

🔗 [Ver el video tutorial](https://youtu.be/AKCPBTu_CYE)
