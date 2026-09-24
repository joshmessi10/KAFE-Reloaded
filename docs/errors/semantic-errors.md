# Semantic errors

Semantic errors occur during execution when code is syntactically valid but violates language rules.

---

## Type errors

### Assigning an incompatible type

```
-- Error
INT x = 5.5;

-- Mensaje
TypeError: Expected INT, obtained FLOAT
```

### Assigning an incompatible value to a list

```
-- Error
List[FLOAT] a = [5.32, 0.234, 3.14, 2.7];
a[3] = 45;  -- 45 is INT; FLOAT is expected

-- Mensaje
TypeError: Expected FLOAT, obtained INT
```

### VOID as a variable type

```
-- Error
VOID a = 5;

-- Mensaje
TypeError: VOID cannot be used as variable type
```

### VOID as a parameter

```
-- Error
drip display(message: VOID) => VOID:
    show(message);
;

-- Mensaje
TypeError: VOID cannot be used as parameter type
```

---

## Name errors

### Undefined variable

```
-- Error
show(x);

-- Mensaje
NameError: Variable 'x' not defined
```

### Undefined function

```
-- Error
drip add(a: INT, b: INT) => INT:
    return a + b;
;

displayMessage(1, 2);  -- Function is not defined

-- Mensaje
NameError: Function 'displayMessage' not defined
```

### Redeclaring a variable

```
-- Error
INT var = 234;
BOOL var = True;

-- Mensaje
NameError: Variable 'var' already defined
```

### Redeclaring a function

```
-- Error
drip multiply(a: INT, b: INT) => INT:
    return a * b;
;

drip multiply(a: INT) => INT:
    return a * a;
;

-- Mensaje
NameError: Function 'multiply' already defined
```

---

## Index errors

### Non-integer index

```
-- Error
List[List[INT]] matrix = [[1, 2], [3, 4]];
show(matrix[4.5][2 - 1]);

-- Mensaje
IndexError: Index must be an integer, obtained FLOAT
```

### Index out of range

```
-- Error
STR a = "Hello";
show(a[45]);

-- Mensaje
IndexError: Index 45 out of bounds for collection of size 5
```

---

## Function errors

### Incorrect number of arguments

```
-- Error
drip add(a: INT, b: INT) => INT:
    return a + b;
;

show(add(1));  -- One argument is missing

-- Mensaje
Exception: 'add' expects 2 args, got 1
```

### Incorrect argument type

```
-- Error
drip add(a: INT, b: INT) => INT:
    return a + b;
;

show(add("hello", 5));  -- "hello" is not an INT

-- Mensaje
TypeError: Function add expects argument of type INT, got type STR
```

### Incorrect return type

```
-- Error
drip add(a: INT, b: INT) => INT:
    return bool(a + b);  -- Returns BOOL; INT is expected
;

-- Mensaje
TypeError: Expected INT, obtained BOOL
```

### VOID function returning a value

```
-- Error
drip display(a: INT, b: INT) => VOID:
    return 5;  -- A VOID function must not return a value
;

-- Mensaje
TypeError: Function declared VOID must not return a value
```

---

## List errors

### Heterogeneous list

```
-- Error
List[BOOL] a = [True] + [[False]];

-- Mensaje
Exception: Expected homogeneous list
```

### Assignment of an incompatible type

```
-- Error
List[List[INT]] a = [[5, 4], [4, 34]];
a[0] = 5;  -- 5 is not a List[INT]

-- Mensaje
TypeError: Expected List[INT], obtained INT
```

---

## Loop errors

### Infinite loop

```
-- Error
INT i = 0;
while (True):
    i = i + 1;
;

-- Mensaje
RuntimeError: Maximum number of iterations exceeded in while loop
```

### Non-iterable variable in a for loop

```
-- Error
INT x = 5;
for (i in x):
    show(i);
;

-- Mensaje
TypeError: Variable in for must be iterable, got INT
```

### Non-boolean condition

```
-- Error
INT x = 5;
while (x):
    show(x);
;

-- Mensaje
TypeError: Condition in while must be boolean, got INT
```

---

## Import errors

### Module not found

```
-- Error
import missing_module;

-- Mensaje
FileNotFoundError: Module file for 'missing_module' not found. Tried: ...
```

### Library not imported

```
-- Error (numk has not been imported)
show(numk.add([[1]], [[2]]));

-- Mensaje
Exception: library not imported
```

---

## File errors

### File not found

```
-- Error
STR content = files.read("missing.txt");

-- Mensaje
FileNotFoundError: File 'missing.txt' not found at /path/
```

### File already exists

```
-- Error
files.create("existing.txt");  -- The file already exists

-- Mensaje
FileExistsError: File 'existing.txt' already exists at /path/
```
