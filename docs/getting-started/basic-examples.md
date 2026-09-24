# Basic examples

## Variable declarations

```kafe
-- Primitive types
INT a = 5;
BOOL b = True;
STR c = 'Hello';
STR d = "World";
FLOAT e = 3.14;

-- Lists
List[INT] numbers = [1, 2, 3];
List[BOOL] flags = [True, False, True];
List[List[FLOAT]] matrix = [[1.5, 2.5], [3.5, 4.5]];

-- Nested lists (matrices)
List[List[INT]] matrix2 = [
    [234, 234],
    [2341, 1234]
];

-- Declaration without initialization
INT x;          -- x = 0
List[INT] L;    -- L = []
```

---

## Operators

### Arithmetic

```kafe
show(5 + 4);      -- 9
show(10 - 3);     -- 7
show(3 * 4);      -- 12
show(10 / 4);     -- 2.5
show(5 ^ 2);      -- 25
show(5 % 4);      -- 1
show(5 + 4 * 2);  -- 13 (precedencia)
show((5 + 4) * 2); -- 18 (parentheses)
```

### Comparison

```kafe
show(4 == 5);  -- False
show(5 == 5);  -- True
show(4 != 5);  -- True
show(4 < 5);   -- True
show(6 <= 6);  -- True
show(4 > 5);   -- False
show(6 >= 6);  -- True
```

### Logical

```kafe
show(True && False);  -- False
show(True || False);  -- True
show(!False);         -- True
show(!True);          -- False
```

### Concatenation

```kafe
show('asdf' + "qwerty");       -- asdfqwerty
show([1, 2] + [3, 4]);         -- [1, 2, 3, 4]
```

---

## Strings and escape sequences

```kafe
-- Supported escape sequences
STR s = "Hello\n\tWorld!\" a \"";
show(s);
```

| Sequence | Description |
|-----------|-------------|
| `\n` | Newline |
| `\t` | Tab |
| `\r` | Carriage return |
| `\\` | Literal backslash |
| `\"` | Literal double quote |
| `\'` | Literal single quote |

!!! error "Common errors"
    - `\q` or `\u` → Error: invalid escape sequence
    - `\` at the end of a string → Error: incomplete escape sequence
    - Unclosed string → Syntax error

---

## Built-in functions

```kafe
-- show() - Print
show(5);
show("Hello");
show([1, 2, 3]);

-- pour() - Read input
STR input = pour("Enter something: ");

-- range() - Generate sequences
show(range(4));        -- [0, 1, 2, 3]
show(range(1, 5));     -- [1, 2, 3, 4]
show(range(0, 10, 2)); -- [0, 2, 4, 6, 8]

-- len() - Length
show(len([1, 2, 3]));  -- 3
show(len("Hello"));    -- 5

-- append() - Add an element
List[INT] nums = [1, 2];
append(nums, 3);       -- nums = [1, 2, 3]

-- remove() - Remove an element
remove(nums, 2);       -- nums = [1, 3]

-- Type conversions
INT a = int("5");      -- 5
FLOAT b = float("3.14"); -- 3.14
STR c = str(42);       -- "42"
BOOL d = bool(1);      -- True
```

---

## List indexing

```kafe
List[INT] nums = [10, 20, 30];

-- Zero-based indexing
show(nums[0]);   -- 10

-- Negative indices
show(nums[-1]);  -- 30 (last element)

-- Modification
nums[0] = 99;
show(nums[0]);   -- 99

-- Matrices (nested lists)
List[List[INT]] matrix = [[1, 2], [3, 4]];
show(matrix[1][0]);  -- 3
```

---

## Comments

```kafe
-- Single-line comment

INT x = 10;  -- Trailing comment

->
This is a
multiline
comment
<-

INT y = 20;
```
