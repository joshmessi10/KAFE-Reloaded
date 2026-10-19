# Primer Programa

## Hello World

El programa más básico en KAFE:

```kafe
show("¡Hola, KAFE!");
```

Para ejecutarlo, guárdalo como `hola.kf` y ejecuta:

```bash
python src/Kafe.py hola.kf
```

---

## Entrada de Datos

Usa `pour()` para leer datos del usuario:

```kafe
STR nombre = pour("¿Cómo te llamas? ");
show("Hola, " + nombre);
```

---

## Variables y Tipos

KAFE es de **tipado estático explícito**. Debes declarar el tipo de cada variable:

```kafe
-- Tipos primitivos
INT edad = 25;
FLOAT pi = 3.14;
BOOL activo = True;
STR nombre = "KAFE";

-- Listas
List[INT] numeros = [1, 2, 3, 4, 5];
List[List[INT]] matriz = [[1, 2], [3, 4]];

-- Sin inicialización (valor por defecto)
INT x;  -- x = 0
```

---

## Operaciones Básicas

```kafe
-- Aritmética
show(5 + 3);    -- 8
show(10 / 3);   -- 3.333...
show(2 ^ 8);    -- 256
show(17 % 5);   -- 2

-- Comparación
show(5 == 5);   -- True
show(3 > 7);    -- False

-- Lógica
show(True && False);  -- False
show(True || False);  -- True
show(!True);          -- False

-- Concatenación de strings
show("Hola" + " " + "Mundo");
```

---

## Condicionales

```kafe
INT edad = 20;

if (edad >= 18):
    show("Mayor de edad");
; elif (edad >= 12):
    show("Adolescente");
; else:
    show("Niño");
;
```

---

## Bucles

```kafe
-- Bucle for
for (i in range(5)):
    show(i);
;

-- Bucle while
INT contador = 0;
while (contador < 5):
    show(contador);
    contador = contador + 1;
;
```

---

## Funciones

```kafe
-- Definición con drip
drip sumar(a: INT, b: INT) => INT:
    return a + b;
;

show(sumar(3, 4));  -- 7

-- Currificación
drip restar(a: INT, b: INT) => INT:
    return a - b;
;

FUNC(INT)=>INT restar5 = restar(5);
show(restar5(3));  -- 2
```

---

## Siguiente Paso

Una vez que puedas ejecutar estos ejemplos, explora la [Guía de Ejemplos Básicos](ejemplos-basicos.md) para ver más detalles sobre cada feature del lenguaje.
