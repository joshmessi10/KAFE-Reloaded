# Lexical structure

## The idea in one sentence

The **lexical structure** is the set of rules that says how the smallest pieces of a program are written: words, numbers, texts, symbols and comments.

## An everyday comparison

When you read a sentence, your eyes don't see loose letters: they see **words** separated by spaces and punctuation. Once the words are separated, you understand the sentence.

KAFE does the same with your program. Before running it, a part of the interpreter called the **lexer** reads the text letter by letter and cuts it into pieces called **tokens**. A token is like a word of the program: `INT`, `total`, `=`, `10`, `;`… Spaces and comments go in the bin: they are only there for people.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/tutorial-lang1-tokens.svg"
<figcaption>The lexer cuts the line into seven tokens and gives each one its type. The comment is thrown away.</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/tutorial/lexical-structure-tokens.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lexical-structure-tokens.expec"
```

!!! tip "What happened here?"
    1. The lexer cut the first line into the tokens `INT`, `total`, `=`, `10`, `+`, `2` and `;`.
    2. Another part of the interpreter, the **parser**, checked that those tokens came in a valid order: "type, name, `=`, value, `;`".
    3. Finally KAFE ran the program and showed `12`.

!!! note "If this is your first time"
    If you don't know what a variable is yet, start with the lesson [Variables and types](../aprende/variables.md). This page goes one step further.

---

## Comments

**The idea:** a comment is a note for people. KAFE ignores it completely.

**Comparison:** it's like writing in pencil in the margin of a cookbook. The recipe doesn't change; your note only helps you remember something.

KAFE has two kinds of comment:

| Kind | How you write it | What it does |
|---|---|---|
| Single-line | `--` | Ignores everything after it until the end of that line |
| Multiline | `-> ... <-` | Ignores everything between `->` and `<-`, even across many lines |

Multiline comments can be **nested**: you can put one inside another, and each `->` needs its own `<-`.

```kafe
--8<-- "tests/DocsExamples/tutorial/lexical-structure-comments.en.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lexical-structure-comments.en.expec"
```

!!! tip "What happened here?"
    Out of the whole program, KAFE only "saw" two instructions: `INT points = 10;` and `show(points);`. Everything else was comments.

### Common error: `--` inside a calculation

Because `--` starts a comment, you **can't** put two minus signs together. In `5--3`, KAFE sees the number `5` and then a comment that eats the rest of the line (including the parenthesis!).

```kafe
--8<-- "tests/DocsExamples/tutorial/lexical-structure-double-minus.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lexical-structure-double-minus.error.stderr.expec"
```

The closing parenthesis ended up inside the comment, so on line 2 KAFE was still waiting for a `)`. To fix it, leave a space or use parentheses: `5 - -3` or `5 - (-3)`.

---

## Identifiers

**The idea:** an **identifier** is the name you invent for a variable, a function or a parameter.

**Comparison:** it's the label you stick on a box. You can write what you like on the label, but with a few rules so everyone reads it the same way.

**Rules:**

- It starts with a letter (`a`–`z`, `A`–`Z`) or an underscore (`_`).
- After that it may contain letters, digits (`0`–`9`) and underscores.
- KAFE is **case-sensitive**: `Score` and `score` are two different names, and `True` is not the same as `true`.
- It can't be a reserved word (see the table below).
- A lone underscore (`_`) is **not** an identifier: it is a reserved symbol of the language.
- Accented letters and `ñ` are not allowed in names (they are fine inside texts). If you write `INT año = 1;`, KAFE shows a confusing message, `unterminated string literal`, even though there is no text: the real cause is the `ñ`.

```kafe
--8<-- "tests/DocsExamples/tutorial/lexical-structure-identifiers.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lexical-structure-identifiers.expec"
```

!!! tip "What happened here?"
    `my_variable`, `_private` and `var2` are valid names; their sum is `35`. `Score` and `score` are two different boxes: one holds `1` and the other `2`.

### Common error: starting a name with a number

```kafe
--8<-- "tests/DocsExamples/tutorial/lexical-structure-identifier-digit.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lexical-structure-identifier-digit.error.stderr.expec"
```

The lexer read `2` as a number, and KAFE expected a name (`ID`). Rename it to `players2`. The same happens with a hyphen: `my-variable` is read as `my` minus `variable`; use `my_variable`.

---

## Reserved words

**The idea:** some words already have a fixed meaning in KAFE. They are called **reserved words** and you can't use them as names.

**Comparison:** in a match, a player can't wear the referee's shirt. Those words are already "taken".

| Reserved word | What it's for |
|---|---|
| `INT`, `FLOAT`, `BOOL`, `STR`, `VOID` | Basic types |
| `List` | List type |
| `FUNC` | Function type |
| `GESHA` | Type for deep learning models |
| `PARDOS` | Type for data tables (DataFrames) |
| `MACHINE` | Type for machine learning objects |
| `True`, `False` | Truth values (booleans) |
| `if`, `elif`, `else` | Conditionals |
| `while`, `for`, `in` | Loops |
| `drip` | Declare a function |
| `return` | Return a value |
| `import` | Load libraries |
| `show` | Show a value on the console |
| `pour` | Read what the user types |
| `range`, `len` | Built-in functions |
| `append`, `remove` | Change lists |
| `int`, `float`, `str`, `bool` | Convert a value to another type |
| `match` | Reserved for the future (does nothing yet) |

```kafe
--8<-- "tests/DocsExamples/tutorial/lexical-structure-reserved-word.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lexical-structure-reserved-word.error.stderr.expec"
```

`show` is a reserved word, so it can't be the name of a variable. Pick another name, for example `shown`.

---

## Literals { #literales }

**The idea:** a **literal** is a value written directly in the code, as it is: `42`, `3.14`, `"Hello"`, `True`, `[1, 2, 3]`.

**Comparison:** if a variable is a labeled box, a literal is the thing you put inside the box.

### Numbers { #numeric-literals }

- An **integer** (`INT`) is just digits: `42`.
- A **decimal** (`FLOAT`) has a point with digits on **both sides**: `3.14`. (`1.` and `.5` are not valid.)
- **Scientific notation** is for very large or very small numbers: `2.5e10` means 2.5 × 10¹⁰. The `e` can be upper or lower case, and the exponent may have a sign (`1.2e-3`). A number in scientific notation is always a `FLOAT`, even without a point (`3E2` is `300.0`).

```kafe
--8<-- "tests/DocsExamples/tutorial/lexical-structure-numbers.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lexical-structure-numbers.expec"
```

!!! note "Negative numbers"
    `-5` is not a single token: it's the `-` operator applied to the number `5`. That's why it works the same in `-5` as in `-(2 + 3)`.

### Texts { #string-literals }

A text (`STR`) goes between **double** quotes (`"Hello"`) or **single** quotes (`'Hello'`). Both forms are the same. A text can't cross the end of a line.

To write special characters inside a text you use an **escape sequence**: a backslash `\` followed by a letter.

| Sequence | Meaning |
|---|---|
| `\n` | New line |
| `\t` | Tab |
| `\r` | Carriage return |
| `\\` | A backslash |
| `\"` | A double quote |
| `\'` | A single quote |

```kafe
--8<-- "tests/DocsExamples/tutorial/lexical-structure-strings.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lexical-structure-strings.expec"
```

!!! tip "What happened here?"
    The empty text `""` showed a blank line. `\n` split the text into two lines, `\t` left a wide gap between `a` and `b`, and `\"` and `\'` put quotes inside the text without closing it.

#### Common error: an escape sequence that doesn't exist

```kafe
--8<-- "tests/DocsExamples/tutorial/lexical-structure-bad-escape.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lexical-structure-bad-escape.error.stderr.expec"
```

`\q` is not in the table. If you wanted a real backslash, write `\\`.

#### Common error: forgetting to close the quotes

```kafe
--8<-- "tests/DocsExamples/tutorial/lexical-structure-unterminated.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lexical-structure-unterminated.error.stderr.expec"
```

The text started at column 5 and was never closed. Add the missing quote: `show("Hello");`.

### Booleans and lists { #boolean-literals }

- **Booleans** (`BOOL`) are `True` and `False`, **starting with a capital letter**.
- A **list** is written between square brackets, with elements separated by commas: `[1, 2, 3]`. The empty list is `[]`, and a list can hold other lists.

```kafe
--8<-- "tests/DocsExamples/tutorial/lexical-structure-bools-lists.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lexical-structure-bools-lists.expec"
```

#### Common error: lowercase `true`

```kafe
--8<-- "tests/DocsExamples/tutorial/lexical-structure-lowercase-true.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lexical-structure-lowercase-true.error.stderr.expec"
```

Since `true` is not a reserved word, the lexer read it as a **name** and KAFE looked for a variable called `true`. Write `True`.

---

## Imports

**The idea:** `import` loads a **library**, an extra toolbox (maths, charts, neural networks…).

**Comparison:** it's like taking the blender out of the cupboard before making a smoothie. If you don't take it out, you can't use it.

```kafe
import library_name;
```

```kafe
--8<-- "tests/DocsExamples/tutorial/lexical-structure-imports.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lexical-structure-imports.expec"
```

**Rules:**

- Imports go **at the beginning** of the file, before any other instruction.
- An import is valid for the whole file.
- Aliases (`as`) are not supported yet.
- Using a library you didn't import causes an error.

```kafe
--8<-- "tests/DocsExamples/tutorial/lexical-structure-not-imported.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lexical-structure-not-imported.error.stderr.expec"
```

Add `import math;` on the first line.

!!! warning "A late `import` fails silently"
    If you write an `import` **after** other instructions, KAFE gives no error: it stops reading the program at that point and nothing after it runs. Always put your imports at the top.

??? info "For the curious 🤓: how KAFE finds a module"
    When you write `import M;` and `M` is not a built-in library, KAFE looks for the file `M.kf` in this order:

    1. The folder of the file doing the import.
    2. The base folder of the KAFE installation.
    3. The parent of the base folder (useful during development).

    KAFE keeps each module in a **cache**: it loads and runs it only the first time. Later imports take its definitions from the cache, which also prevents cycles (a module importing itself through another one). More details in [Imports](imports.md).

---

## What did you learn?

- The lexer cuts your program into **tokens** and throws away spaces and comments (`--` and `-> ... <-`).
- Names start with a letter or `_`, are case-sensitive and can't be reserved words.
- Literals are values written as they are: `42`, `3.14`, `2.5e10`, `"text"`, `True`, `[1, 2]`.
- Imports go at the very top.

??? info "For the curious 🤓: inside the lexer"
    The exact rules live in `src/Kafe_Lexer.g4`. The ANTLR lexer follows the **maximal munch** rule: it always builds the longest possible token. That's why `<=` is a single token rather than `<` followed by `=`, and why `--` beats two separate `-`. When two rules produce a token of the same length, the one that appears first in the grammar wins; that's how `show` becomes the reserved word `SHOW` instead of an `ID`.

[Next: Type system :material-arrow-right:](type-system.md){ .md-button .md-button--primary }
