# Estructura Léxica

Esta sección describe los elementos mínimos del lenguaje: tokens, comentarios, identificadores y literales.

---

## Comentarios

KAFE soporta dos tipos de comentarios. Los comentarios no afectan la ejecución del programa.

| Tipo | Sintaxis | Descripción |
|------|----------|-------------|
| Una línea | `--` | Todo el texto siguiente en esa línea es ignorado |
| Múltiples líneas | `-> ... <-` | Delimitado por `->` y `<-`. Puede ocupar varias líneas |

```kafe
-- Comentario de una sola línea
INT x = 10;  -- Comentario al final de instrucción

->
  Este es un comentario
  de múltiples líneas en KAFE.
<-
```

!!! info "Comentarios anidados"
    KAFE permite comentarios de múltiples líneas anidados:
    ```kafe
    ->
    Nivel 1
    ->
    Nivel 2 anidado
    <-
    Texto después del nivel 2
    <-
    ```

---

## Identificadores

Los identificadores son nombres usados para variables, funciones y parámetros.

**Reglas:**

- Deben iniciar con una letra (`a`–`z`, `A`–`Z`) o guion bajo (`_`)
- Pueden contener letras, dígitos (`0`–`9`) y guiones bajos
- El lenguaje es **sensible a mayúsculas y minúsculas**: `True` ≠ `true`
- Las palabras reservadas no pueden usarse como identificadores

```kafe
-- Válidos
INT mi_variable = 5;
INT _privada = 10;
INT var2 = 20;

-- Inválidos
-- INT 2variable = 5;    -- Error: inicia con dígito
-- INT mi-variable = 5;  -- Error: guión no es guion bajo
```

---

## Palabras Reservadas

| Palabra Reservada | Uso |
|-------------------|-----|
| `INT`, `FLOAT`, `BOOL`, `STR`, `VOID` | Declaración de tipos primitivos |
| `List` | Declaración de listas |
| `FUNC` | Declaración de variables funcionales |
| `GESHA` | Tipo para modelos de Deep Learning |
| `PARDOS` | Tipo para DataFrames |
| `MACHINE` | Tipo para objetos de ML |
| `True`, `False` | Literales booleanos |
| `if`, `elif`, `else` | Estructuras de decisión |
| `while`, `for`, `in` | Estructuras de control de bucle |
| `drip` | Declaración de función |
| `return` | Retorno de valor |
| `import` | Carga de librerías |
| `show` | Salida de datos por consola |
| `pour` | Entrada de datos del usuario |
| `range`, `len` | Funciones integradas |
| `append`, `remove` | Mutación de listas |

---

## Literales

### Literales Numéricos

```kafe
INT entero = 42;
FLOAT decimal = 3.14;
FLOAT cientifica = 2.5e10;    -- Notación científica
FLOAT cientifica2 = 1.2e-3;   -- Exponente negativo
```

### Literales de Texto

```kafe
STR simple = 'Hola';
STR doble = "Mundo";
STR vacia = "";
```

Acepta comillas simples (`'`) o dobles (`"`). Soporta secuencias de escape:

| Secuencia | Descripción |
|-----------|-------------|
| `\n` | Nueva línea |
| `\t` | Tabulación |
| `\r` | Retorno de carro |
| `\\` | Backslash literal |
| `\"` | Comilla doble literal |
| `\'` | Comilla simple literal |

### Literales Booleanos

```kafe
BOOL verdadero = True;
BOOL falso = False;
```

!!! warning "Case-sensitive"
    `True` y `False` deben escribirse con mayúscula inicial. `true` y `false` no son válidos.

### Literales de Lista

```kafe
List[INT] vacia = [];
List[INT] numeros = [1, 2, 3];
List[List[INT]] matriz = [[1, 2], [3, 4]];
```

---

## Importaciones

El sistema de módulos permite extender las capacidades del lenguaje cargando librerías predefinidas.

**Sintaxis:**

```kafe
import nombre_libreria;
```

**Reglas:**

- La importación debe realizarse al inicio del archivo
- El alcance del import es global al archivo
- No se soportan alias (`as`) actualmente
- Intentar usar una librería no importada resultará en un error

### Algoritmo de Resolución de Módulos

Cuando se invoca `import M;`, el motor busca el archivo `M.kf` siguiendo este orden:

1. Directorio de trabajo actual (donde se encuentra el archivo que importa)
2. Directorio base de la instalación de KAFE
3. Directorio superior al base (entorno de desarrollo)

### Gestión de Ciclos y Caché

KAFE implementa una caché de módulos para optimizar la carga y prevenir ciclos de importación. Un módulo solo se carga y ejecuta la primera vez que se encuentra; las llamadas subsiguientes recuperan las definiciones de la caché.
