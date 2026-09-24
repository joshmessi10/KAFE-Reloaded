# Control structures

---

## Conditionals

Conditional statements execute different code blocks based on logical conditions.

**General syntax:**

```kafe
if (condition):
    -- true branch
; elif (condition):
    -- alternative branch
; else:
    -- default branch
;
```

| Element | Description |
|----------|-------------|
| `if (cond) :` | Starts the block. The colon (`:`) is required. |
| `elif (cond) :` | Alternative condition evaluated if the previous one was `False`. |
| `else :` | Default block when no condition matched. |
| `;` | Block closing delimiter. |

### Block rules

- The `:` symbol marks the beginning of a block.
- The `;` symbol marks the end of a block.
- Indentation is optional but recommended (four spaces).

### Example

```kafe
INT age = 25;
BOOL hasLicense = True;

if (age >= 18):
    if (hasLicense):
        show("Can drive normally");
    ; else:
        show("Does not have a license");
    ;
; else:
    show("Is under 18");
;
```

---

## while loop

Repeatedly executes a block while the condition is true.

**Syntax:**

```kafe
while (condition):
    -- statements
    ;
```

!!! warning "Iteration limit"
    KAFE limits each `while` loop to **10,000 iterations** to prevent infinite loops.

```kafe
INT i = 0;
while (i < 5):
    show(i);
    i = i + 1;
    ;
```

---

## for loop

Iterates over collection elements or a numeric range.

**Syntax:**

```kafe
for (element in collection):
    -- statements
    ;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `element` | variable | Variable that receives each element's value. |
| `collection` | `List[T]` / `range` | List or range being iterated over. |

### Iterate over a list

```kafe
List[STR] letters = ['K', 'A', 'F', 'E'];
for (letter in letters):
    show(letter);
;
```

### Iterate over a range

```kafe
for (i in range(0, 10)):
    show(i);
;
```

---

## range() function

Generates a sequence of integers. It accepts one, two, or three arguments:

| Form | Parameters | Behavior | Example |
|-------|-----------|----------------|---------|
| `range(n)` | `n: INT` | Sequence from 0 to n-1 | `range(4)` → `[0,1,2,3]` |
| `range(a, b)` | `a, b: INT` | Sequence from a to b-1 | `range(1,4)` → `[1,2,3]` |
| `range(a, b, p)` | `a, b, p: INT` | Sequence with a step of p | `range(0,5,2)` → `[0,2,4]` |

### Behavior and special cases

- **Bounds**: The upper bound (`stop`) is never included.
- **Negative step**: If `p < 0`, generates a descending sequence (`range(5, 0, -1)`).
- **Zero step**: If `p = 0`, raises a runtime error.
- **Return value**: `range()` returns a `List[INT]` object.

```kafe
show(range(4));        -- [0, 1, 2, 3]
show(range(1, 5));     -- [1, 2, 3, 4]
show(range(0, 10, 2)); -- [0, 2, 4, 6, 8]
show(range(5, 0, -1)); -- [5, 4, 3, 2, 1]
```

---

## break and continue

!!! note "Note"
    KAFE currently **does not support** `break` or `continue` inside loops. To exit a loop, use a control condition or `return` inside a function.

---

## Complete example

```kafe
-- FizzBuzz
for (i in range(1, 21)):
    if (i % 15 == 0):
        show("FizzBuzz");
    ; elif (i % 3 == 0):
        show("Fizz");
    ; elif (i % 5 == 0):
        show("Buzz");
    ; else:
        show(i);
    ;
;
```
