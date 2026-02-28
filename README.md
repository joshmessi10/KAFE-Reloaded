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
