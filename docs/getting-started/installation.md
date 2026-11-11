# Instalación

## La idea en una frase

Para usar KAFE solo necesitas **Visual Studio Code** y la extensión **KAFE - Neural Language Suite**. La extensión prepara todo lo demás por ti.

## Una comparación de la vida diaria

Piensa en una **cocina de alquiler ya equipada**. Tú llegas, abres la puerta y la estufa, las ollas y los ingredientes ya están ahí. No tienes que comprar ni instalar nada más: solo cocinar.

- **Visual Studio Code** (VS Code) es la cocina: un **editor de código**, un programa para escribir y ejecutar programas.
- La **extensión de KAFE** es el equipo de cocina: le enseña a VS Code a entender KAFE, a colorear tu código y a ejecutarlo.
- El **runtime** es la estufa: el motor que hace funcionar tus programas. La extensión lo instala sola, en un lugar privado.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/tutorial-start-instalar.svg"
<figcaption>Los cinco pasos: 1) instala VS Code, 2) busca e instala la extensión KAFE, 3) abre una carpeta y confía en ella, 4) espera a que se prepare el runtime y 5) crea un archivo .kf y ejecútalo.</figcaption>
</figure>

## Lo que necesitas

- Una computadora con Windows (x64), macOS (Intel o Apple Silicon) o Linux (x64).
- **Visual Studio Code 1.96.0** o más nuevo.
- Conexión a internet la primera vez, para que la extensión descargue su runtime.

No necesitas instalar Python, Java ni ninguna otra herramienta.

## Paso 1: instala Visual Studio Code

Descarga VS Code desde [code.visualstudio.com](https://code.visualstudio.com/) e instálalo como cualquier otro programa. Si ya lo tienes, revisa que sea la versión 1.96.0 o más nueva.

## Paso 2: instala la extensión de KAFE

1. Abre VS Code.
2. Abre la vista de **Extensiones** con `Ctrl+Shift+X` (en macOS, `Cmd+Shift+X`). También puedes hacer clic en el ícono de los cuadritos de la barra lateral.
3. Escribe **KAFE** en el buscador.
4. Elige **KAFE - Neural Language Suite**, del autor **KAFEGROUP**, y haz clic en **Install**.

También puedes abrir la [página de la extensión en el Marketplace](https://marketplace.visualstudio.com/items?itemName=KAFEGROUP.kafe-neural-suite) e instalarla desde ahí. Su identificador es `KAFEGROUP.kafe-neural-suite`.

## Paso 3: abre una carpeta y confía en ella

Crea una carpeta para tus programas, por ejemplo `mis-programas-kafe`. En VS Code, usa **File → Open Folder…** (Archivo → Abrir carpeta) y elígela.

VS Code te preguntará si **confías** en los autores de los archivos de esa carpeta. Como la carpeta es tuya, responde que sí (*Yes, I trust the authors*).

!!! note "¿Por qué hay que confiar en la carpeta?"
    Ejecutar un programa es poderoso: puede leer y escribir archivos. Por eso VS Code solo deja ejecutar programas en carpetas de confianza. En el **modo restringido** (una carpeta en la que no confías), la extensión no ejecuta programas.

## Paso 4: espera a que se prepare el runtime

Cuando abres una carpeta de confianza, la extensión prepara **automáticamente** su runtime privado. Verás un aviso de progreso. Espera a que termine; puede tardar unos minutos la primera vez.

!!! tip "Si algo sale mal"
    - Si la preparación falla, la extensión te ofrece **reintentar**. Revisa tu conexión a internet y vuelve a intentarlo.
    - También puedes prepararla a mano: abre la **paleta de comandos** con `Ctrl+Shift+P` (en macOS, `Cmd+Shift+P`), escribe **KAFE: Install Runtime** y presiona `Enter`.
    - Ocultar el aviso de progreso no cancela la preparación: sigue trabajando en segundo plano.

## Paso 5: crea tu primer archivo y ejecútalo

1. En VS Code, crea un archivo nuevo dentro de tu carpeta y guárdalo como `prueba.kf`. La terminación `.kf` le dice a VS Code que es un programa de KAFE.
2. Escribe este programa y **guarda** el archivo:

    ```kafe
    --8<-- "tests/DocsExamples/tutorial/installation-prueba.kf"
    ```

3. Ejecútalo con `Ctrl+F5` (en macOS, `Cmd+F5`), o con el comando **KAFE: Run File** de la paleta de comandos.

Se abre una **terminal** llamada **KAFE Run**: una ventana de texto dentro de VS Code donde aparecen los resultados. Si todo está bien, verás:

```text
--8<-- "tests/DocsExamples/tutorial/installation-prueba.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. La primera línea empieza con `--`: es un **comentario**, una nota para personas que KAFE ignora.
    2. `show` mostró el texto y luego el resultado de `2 + 3`.
    3. Los resultados aparecieron en la terminal **KAFE Run**. ¡Tu cocina está lista!

## Extras opcionales

No los necesitas para empezar. Instálalos solo cuando los uses.

| Para… | Comando de la paleta |
|---|---|
| Programas que usan `import huggingface;` (conjuntos de datos de Hugging Face) | **KAFE: Install Hugging Face Pack** |
| Programas que usan `import kaggle;` (conjuntos de datos de Kaggle) | **KAFE: Install Kaggle Pack** |
| Hablar con el **Tutor**, un asistente que responde preguntas sobre KAFE | **KAFE: Open Tutor** |

Si un programa importa `huggingface` o `kaggle` sin el paquete instalado, KAFE se detiene con un mensaje que dice qué comando usar.

!!! note "El Tutor necesita una clave"
    El Tutor usa el servicio DeepSeek, así que necesitas una **clave de API** de DeepSeek. Configúrala con **KAFE: Configure Provider Key**. VS Code la guarda de forma segura. Al enviar una pregunta, tu mensaje y el contexto que autorices se comparten con DeepSeek. Puedes ver más en la [guía de la extensión](../extension/vscode.md).

## ¿Qué aprendiste?

- Para usar KAFE instalas VS Code y la extensión **KAFE - Neural Language Suite**; no necesitas nada más.
- La extensión prepara su runtime sola cuando abres una carpeta de confianza.
- Un programa `.kf` guardado se ejecuta con `Ctrl+F5` (`Cmd+F5` en macOS) y su salida aparece en la terminal **KAFE Run**.

??? note "Para quienes trabajan en el código de KAFE"
    Esta parte es solo para quienes quieren **modificar** KAFE (su intérprete, sus librerías o esta documentación). Para aprender a programar no la necesitas.

    **Requisitos:** Python 3.11 o más nuevo, Git, uv (instalado con las [instrucciones oficiales](https://docs.astral.sh/uv/getting-started/installation/)), y Java JDK 11 o más nuevo con ANTLR 4.13.2 para generar el *parser* en una copia nueva o después de cambiar la gramática.

    **1. Java.** Instala [Java JDK 11 o más nuevo](https://www.oracle.com/java/technologies/downloads/) y compruébalo con `java -version`. Java solo hace falta para generar el parser, no para ejecutar KAFE cuando los archivos generados ya existen.

    **2. Copia el repositorio e instala las dependencias:**

    ```bash
    git clone https://github.com/joshmessi10/KAFE-Reloaded.git
    cd KAFE-Reloaded
    uv sync --locked --group dev
    ```

    La integración con Hugging Face (`KafeHF`) es opcional: `uv sync --locked --extra huggingface`.

    **3. ANTLR.** Descarga el [ANTLR 4.13.2 JAR](https://www.antlr.org/download/antlr-4.13.2-complete.jar) en la carpeta `src/` del repositorio. Si lo guardas en otro lugar, usa esa ruta en la orden siguiente.

    **4. Genera el parser** (obligatorio en una copia nueva), desde la raíz del repositorio:

    ```bash
    cd src
    java -jar antlr-4.13.2-complete.jar -no-listener -visitor -Dlanguage=Python3 Kafe_Grammar.g4
    cd ..
    ```

    Los archivos generados no se guardan en Git. Si faltan, KAFE muestra `ModuleNotFoundError: No module named 'Kafe_GrammarLexer'`.

    **Con Nix:** el *Nix Flake* trae Python, uv, Java, ANTLR y otras herramientas. Instala Nix y activa los *flakes* con las [instrucciones oficiales](https://nixos.org/download/), y luego:

    ```bash
    nix develop
    uv sync --locked --group dev
    ```

    **Ejecutar un programa** desde la raíz del repositorio:

    ```bash
    uv run --locked python src/Kafe.py tests/DocsExamples/tutorial/installation-prueba.kf
    ```

    **Ejecutar las pruebas:**

    ```bash
    uv run --locked --group dev pytest tests/
    uv run --locked --group dev pytest tests/test_KafeMACHINE.py
    ```

    `src/Makefile` necesita Make y una terminal compatible con POSIX. En Windows, usa pytest directamente.

    **Ver la documentación en tu computadora:**

    ```bash
    uv sync --locked --group docs --no-dev
    uv run --locked --group docs --no-dev mkdocs serve
    ```

    **Comprobar la instalación:**

    ```bash
    uv run --locked python --version
    uv run --locked python -c "import antlr4"
    java -version
    java -jar src/antlr-4.13.2-complete.jar -version
    ```

[Siguiente: Tu primer programa :material-arrow-right:](first-program.md){ .md-button .md-button--primary }
