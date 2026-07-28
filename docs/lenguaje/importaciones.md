# Sistema de Importaciones

El sistema de módulos permite extender las capacidades del lenguaje cargando librerías predefinidas o archivos KAFE personalizados.

---

## Sintaxis

```kafe
import nombre_libreria;
```

---

## Librerías Integradas

| Nombre de Importación | Librería | Propósito |
|----------------------|----------|-----------|
| `numk` | KafeNUMK | Álgebra lineal (tipo NumPy) |
| `math` | KafeMATH | Funciones matemáticas |
| `plot` | KafePLOT | Visualización de datos (SVG) |
| `files` | KafeFILES | E/S de archivos |
| `geshaDeep` | KafeGESHA | Deep Learning / Redes neuronales |
| `pardos` | KafePARDOS | DataFrames / CSV |
| `machine` | KafeMACHINE | Utilidades de ML |

```kafe
import numk;
import math;
import plot;
import files;
import geshaDeep;
import pardos;
import machine;
```

---

## Reglas de Importación

1. **Ubicación**: La importación debe realizarse al inicio del archivo
2. **Alcance**: Global al archivo
3. **Alias**: No se soportan alias (`as`) actualmente
4. **Error**: Usar una librería no importada resultará en error de ejecución

---

## Algoritmo de Resolución de Módulos

Cuando se invoca `import M;`, el motor busca el archivo `M.kf` siguiendo este orden de precedencia:

1. **Directorio de trabajo actual** (donde se encuentra el archivo que importa)
2. **Directorio base** de la instalación de KAFE
3. **Directorio superior** al base (entorno de desarrollo)

```kafe
-- Si el archivo actual está en /proyecto/programa.kf
-- y se ejecuta: import utilidades;
-- KAFE buscará:
--   1. /proyecto/utilidades.kf
--   2. /instalacion_KAFE/utilidades.kf
--   3. /instalacion_KAFE/../utilidades.kf
```

---

## Importación de Archivos KAFE

Puedes importar archivos `.kf` propios:

```kafe
-- En archivo principal.kf
import utilidades;

-- utilidades.kf debe estar en el path de búsqueda
```

### Creando un Módulo

```kafe
-- utilidades.kf
drip sumar(a: INT, b: INT) => INT:
    return a + b;
;

drip esPar(n: INT) => BOOL:
    return n % 2 == 0;
;
```

```kafe
-- programa.kf
import utilidades;

show(utilidades.sumar(3, 4));  -- 7
show(utilidades.esPar(4));     -- True
```

---

## Gestión de Ciclos y Caché

KAFE implementa un sistema de caché para:

1. **Optimizar la carga**: Un módulo solo se ejecuta la primera vez
2. **Prevenir ciclos**: Si el módulo A importa B y B importa A, el segundo import se ignora
3. **Consistencia**: Las definiciones se recuperan de la caché

```kafe
-- Ejemplo de importación circular (prevenida)
-- modulo_a.kf
import modulo_b;
drip funcionA() => VOID: show("A"); ;

-- modulo_b.kf
import modulo_a;  -- Se ignora por caché
drip funcionB() => VOID: show("B"); ;
```

---

## Ejemplo Completo

```kafe
-- Programa principal
import math;
import numk;

-- Usar funciones de math
FLOAT pi = math.pi;
show(math.sqrt(16));  -- 4.0

-- Usar funciones de numk
List[List[INT]] A = [[1, 2], [3, 4]];
List[List[INT]] B = [[5, 6], [7, 8]];

show(numk.add(A, B));      -- [[6,8],[10,12]]
show(numk.transpose(A));   -- [[1,3],[2,4]]
```
