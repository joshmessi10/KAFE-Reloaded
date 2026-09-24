# Import system

The module system extends the language by loading built-in libraries or custom KAFE files.

---

## Syntax

```kafe
import library_name;
```

---

## Built-in libraries

| Import name | Library | Purpose |
|----------------------|----------|-----------|
| `numk` | KafeNUMK | NumPy-style linear algebra |
| `math` | KafeMATH | Mathematical functions |
| `plot` | KafePLOT | Data visualization (SVG) |
| `files` | KafeFILES | File I/O |
| `geshaDeep` | KafeGESHA | Deep learning and neural networks |
| `pardos` | KafePARDOS | DataFrames and CSV |
| `machine` | KafeMACHINE | ML utilities |

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

## Import rules

1. **Placement**: Imports must appear at the beginning of the file.
2. **Scope**: An import is global to the file.
3. **Aliases**: Aliases (`as`) are not currently supported.
4. **Error**: Using a library that has not been imported causes a runtime error.

---

## Module resolution algorithm

When `import M;` is used for a user module, the runtime searches for `M.kf` in this order. Built-in library names resolve through the library registry instead:

1. The directory of the currently executing KAFE file.
2. `src/language_components/imports/` in the KAFE installation.
3. `src/language_components/` in the KAFE installation.

```kafe
-- If the current file is /project/program.kf
-- and it imports utilities, KAFE searches:
--   1. /project/utilities.kf
--   2. <KAFE installation>/src/language_components/imports/utilities.kf
--   3. <KAFE installation>/src/language_components/utilities.kf
```

---

## Importing KAFE files

You can import your own `.kf` files:

```kafe
-- In main.kf
import utilities;

-- utilities.kf must be in one of the search locations
```

### Creating a module

```kafe
-- utilities.kf
drip add(a: INT, b: INT) => INT:
    return a + b;
;

drip isEven(n: INT) => BOOL:
    return n % 2 == 0;
;
```

```kafe
-- program.kf
import utilities;

show(utilities.add(3, 4));  -- 7
show(utilities.isEven(4)); -- True
```

---

## Cycle and cache handling

KAFE uses a cache to:

1. **Optimize loading**: A module is executed only the first time it is imported.
2. **Prevent cycles**: If module A imports B and B imports A, the second import is ignored.
3. **Maintain consistency**: Definitions are retrieved from the cache.

```kafe
-- Circular import example (prevented)
-- module_a.kf
import module_b;
drip functionA() => VOID: show("A"); ;

-- module_b.kf
import module_a;  -- Ignored because of the cache
drip functionB() => VOID: show("B"); ;
```

---

## Complete example

```kafe
-- Main program
import math;
import numk;

-- Use functions from math
FLOAT pi = math.pi;
show(math.sqrt(16));  -- 4.0

-- Use functions from numk
List[List[INT]] A = [[1, 2], [3, 4]];
List[List[INT]] B = [[5, 6], [7, 8]];

show(numk.add(A, B));      -- [[6,8],[10,12]]
show(numk.transpose(A));   -- [[1,3],[2,4]]
```
