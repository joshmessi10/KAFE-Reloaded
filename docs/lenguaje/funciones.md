# Funciones

Las funciones en KAFE se definen con la palabra clave `drip`. Encapsulan lógica reutilizable y pueden tomar parámetros tipados y retornar un valor.

---

## Definición Básica

**Sintaxis:**

```kafe
drip nombreFuncion(param1: TIPO1, param2: TIPO2) => TIPO_RETORNO:
    // cuerpo de la función
    return valor;
    ;
```

| Elemento | Descripción |
|----------|-------------|
| `drip` | Palabra clave para declarar una función |
| `nombreFuncion` | Identificador único |
| `(param1: T1, param2: T2)` | Lista de parámetros obligatorios con sus tipos |
| `=> TIPO_RETORNO` | Tipo del valor de retorno (obligatorio) |
| `return valor` | Instrucción que devuelve el resultado |
| `;` | Cierra el bloque de la función |

```kafe
drip suma(a: INT, b: INT) => INT:
    return a + b;
;

show(suma(9, 6));  -- 15
```

---

## Funciones Currificables

Las funciones soportan **currificación**: pueden invocarse parcialmente, retornando una nueva función que espera los argumentos restantes.

```kafe
drip sumar(a: INT, b: INT) => VOID:
    show(a + b);
;

sumar(10)(5);   -- Currificación → 15
sumar(10, 5);   -- Llamada directa → 15

-- Almacenar función parcialmente aplicada
FUNC(INT)=>INT sumarQuince = sumar(15);
sumarQuince(5);   -- 20
sumarQuince(100); -- 115
```

### Definición Semántica de la Currificación

Dada una función `f : (T1 × T2 × ... × Tn) → Tr`, KAFE la trata como una serie de aplicaciones parciales:

> `f : T1 → (T2 → (... → (Tn → Tr)...))`

Si se proveen `k` argumentos (`k < n`), se genera un objeto funcional que captura dichos valores y queda a la espera de los `n-k` restantes.

| Ventaja | Descripción |
|---------|-------------|
| **Reutilización** | Definir funciones base y especializarlas con valores parciales |
| **Modularidad** | Estilo declarativo y composicional |
| **Expresividad** | Código más claro en contextos funcionales |

---

## Funciones de Orden Superior

Aceptan otras funciones como parámetros o las retornan. El tipo se declara con `FUNC(TIPO_IN) => TIPO_OUT`.

### Con función nombrada

```kafe
drip aplicar(f: FUNC(INT) => INT, n: INT) => INT:
    return f(n);
;

drip inc(x: INT) => INT:
    return x + 1;
;

show(aplicar(inc, 5));  -- 6
```

### Con lambda (anónima)

```kafe
FUNC(INT)=>INT cuadrado = (y: INT) => y * y;
show(aplicar(cuadrado, 4));  -- 16
```

### Retornando funciones

```kafe
drip crearContador(inicial: INT) => FUNC()=>INT:
    INT c = inicial;
    return () => c = c + 1;
;
```

---

## Expresiones Lambda

```kafe
-- Sintaxis
(parámetros) => expresión

-- Ejemplos
(y: INT) => y * y
(x: INT, y: INT) => x + y
(a: INT) => ((b: INT) => a + b)
```

**Características:**

- **Retorno Implícito**: El resultado de la expresión es lo que devuelve la lambda
- **Tipado**: Los parámetros deben estar tipados
- **Uso**: Ideales para funciones de orden superior

---

## Funciones Recursivas

KAFE permite funciones que se invocan a sí mismas. Es obligatorio definir un caso base.

```kafe
drip factorial(n: INT) => INT:
    if (n <= 1):
        return 1;
    ;
    return n * factorial(n - 1);
;

show(factorial(5));  -- 120
```

### Fibonacci

```kafe
drip fibonacci(n: INT) => INT:
    if (n <= 1):
        return n;
    ;
    return fibonacci(n - 1) + fibonacci(n - 2);
;

show(fibonacci(7));  -- 13
```

!!! warning "Advertencia"
    Las funciones recursivas con profundidad excesiva pueden causar desbordamiento de pila. Siempre defina un caso base claro.

---

## Alcance (Scope) y Shadowing

KAFE gestiona la visibilidad de variables mediante un sistema de pila de ámbitos:

- **Alcance Global**: Variables fuera de cualquier función son visibles en todo el archivo
- **Alcance Local**: Variables dentro de funciones, bucles o condicionales solo existen en su bloque
- **Shadowing**: Es posible declarar una variable local con el mismo nombre que una global

```kafe
INT x = 10;  -- Global

drip ejemplo() => VOID:
    INT x = 20;  -- Local (oculta la global)
    show(x);     -- 20
;

ejemplo();
show(x);  -- 10 (la global sigue existiendo)
```

---

## Closures (Clausuras)

Las funciones pueden capturar y recordar el entorno léxico en el que fueron creadas.

```kafe
drip crearContador(inicial: INT) => FUNC()=>INT:
    INT c = inicial;
    return () => c = c + 1;
;

FUNC()=>INT contador = crearContador(0);
show(contador());  -- 1
show(contador());  -- 2
show(contador());  -- 3
```

### Mecanismo de Captura

El closure realiza una **copia superficial (shallow copy)** del mapeo de variables actual en el momento de la definición, garantizando que el estado capturado persista independientemente del ámbito padre.

---

## Ejemplo: Fibonacci con Currificación

```kafe
drip fib(n: INT) => INT:
    if (n <= 1):
        return n;
    ;
    return fib(n - 1) + fib(n - 2);
;

-- Crear versión parcialmente aplicada
FUNC(INT)=>INT fib5 = fib(5);
show(fib5);  -- No funciona así, fib necesita 1 argumento

-- Uso directo
show(fib(10));  -- 55
```
