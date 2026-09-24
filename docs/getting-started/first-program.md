# First program

## Hello World

The simplest KAFE program:

```kafe
show("Hello, KAFE!");
```

To run it, save it as `hello.kf` and run:

```bash
python src/Kafe.py hello.kf
```

---

## Input

Use `pour()` to read user input:

```kafe
STR name = pour("What is your name? ");
show("Hello, " + name);
```

---

## Variables and types

KAFE uses **explicit static typing**. Declare the type of each variable:

```kafe
-- Primitive types
INT age = 25;
FLOAT pi = 3.14;
BOOL active = True;
STR name = "KAFE";

-- Lists
List[INT] numbers = [1, 2, 3, 4, 5];
List[List[INT]] matrix = [[1, 2], [3, 4]];

-- Without initialization (default value)
INT x;  -- x = 0
```

---

## Basic operations

```kafe
-- Arithmetic
show(5 + 3);    -- 8
show(10 / 3);   -- 3.333...
show(2 ^ 8);    -- 256
show(17 % 5);   -- 2

-- Comparison
show(5 == 5);   -- True
show(3 > 7);    -- False

-- Logic
show(True && False);  -- False
show(True || False);  -- True
show(!True);          -- False

-- String concatenation
show("Hello" + " " + "World");
```

---

## Conditionals

```kafe
INT age = 20;

if (age >= 18):
    show("Adult");
; elif (age >= 12):
    show("Teenager");
; else:
    show("Child");
;
```

---

## Loops

```kafe
-- for loop
for (i in range(5)):
    show(i);
;

-- while loop
INT counter = 0;
while (counter < 5):
    show(counter);
    counter = counter + 1;
;
```

---

## Functions

```kafe
-- Definition with drip
drip add(a: INT, b: INT) => INT:
    return a + b;
;

show(add(3, 4));  -- 7

-- Currying
drip subtract(a: INT, b: INT) => INT:
    return a - b;
;

FUNC(INT)=>INT subtract5 = subtract(5);
show(subtract5(3));  -- 2
```

---

## Next step

Once you can run these examples, explore [Basic examples](basic-examples.md) for more details about each language feature.
