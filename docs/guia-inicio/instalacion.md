# Instalación

## Requisitos

- **Python** >= 3.10
- **Git**
- **Java JDK** >= 11 (requerido para ANTLR)
- **ANTLR 4.13.2**
- **Pytest** (para ejecutar tests)

---

## Opción 1: Instalación Manual

### 1. Instalar Java JDK

Descarga desde [Oracle](https://www.oracle.com/java/technologies/downloads/) y verifica:

```bash
java -version
```

### 2. Instalar ANTLR 4.13.2

**Windows:**

```bash
# Descargar el JAR
curl -O https://www.antlr.org/download/antlr-4.13.2-complete.jar

# Crear carpeta y mover
mkdir C:\Users\TuUsuario\.antlr
mv antlr-4.13.2-complete.jar C:\Users\TuUsuario\.antlr\

# Crear archivo antlr.cmd en la misma carpeta con:
# @echo off
# java -jar C:\Users\TuUsuario\.antlr\antlr-4.13.2-complete.jar %*

# Agregar C:\Users\TuUsuario\.antlr al PATH del sistema
# Reiniciar la terminal
```

**Linux/macOS:**

```bash
curl -O https://www.antlr.org/download/antlr-4.13.2-complete.jar
sudo mkdir -p /usr/local/lib
sudo mv antlr-4.13.2-complete.jar /usr/local/lib/
echo "alias antlr='java -jar /usr/local/lib/antlr-4.13.2-complete.jar'" >> ~/.bashrc
source ~/.bashrc
```

### 3. Clonar el Repositorio

```bash
git clone https://github.com/joshmessi10/KAFE-Reloaded.git
cd KAFE-Reloaded
```

### 4. Entorno Virtual

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux/macOS
source .venv/bin/activate
```

### 5. Instalar Dependencias

```bash
pip install -r requirements.txt
```

### 6. Generar el Parser (CRÍTICO)

```bash
cd src
antlr -no-listener -visitor -Dlanguage=Python3 Kafe_Grammar.g4
# O con make:
# make antlr
cd ..
```

!!! warning "Importante"
    Sin este paso obtendrás el error: `ModuleNotFoundError: No module named 'Kafe_GrammarLexer'`

---

## Opción 2: Entorno con Nix Flake

El entorno Nix preconfigura todas las dependencias automáticamente:

```bash
# Instalar Nix (si no lo tienes)
curl -L https://nixos.org/nix/install | sh

# Habilitar flakes
mkdir -p ~/.config/nix
echo "experimental-features = nix-command flakes" >> ~/.config/nix/nix.conf

# Iniciar entorno de desarrollo
nix develop
```

---

## Ejecutar un Programa

```bash
python src/Kafe.py tests/Algorithms/Fibonacci.kf
```

## Ejecutar Tests

```bash
pytest tests/
```

---

## Verificar la Instalación

```bash
# Verificar Java
java -version

# Verificar ANTLR
antlr

# Verificar Python
python --version

# Verificar parser generado
ls src/Kafe_GrammarLexer.py
```
