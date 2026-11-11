# KAFE essentials

This bundled reference describes KAFE's core syntax. Repository fixture expectations are examples, not observations of the learner's current code. Full library documentation and executable runtime availability are separate.

KAFE source files use .kf. Display one expression with show(expression);. print is not a built-in output function. A learner may define a function named print, so do not blindly replace that name inside valid functions, comments, or strings. pour(prompt) writes a prompt, reads console input, and returns text; use show for ordinary output.

Declare variables with case-sensitive types: INT, FLOAT, STR, BOOL, VOID, List[INT], List[FLOAT], or nested List types. Function parameters use name: TYPE. Define a function with drip name(parameters) => RETURN_TYPE: followed by its body and a closing semicolon. Each statement ends with a semicolon. Each complete conditional chain, loop, and function needs a closing semicolon. Join elif and else branches before the conditional chain's final semicolon; do not put a standalone closing semicolon before elif or else.

Top-level statements execute in source order. Declaring a function does not execute its body. There is no special automatic main entry point. If a complete example defines main and intends to run it, add the top-level call main();. A small example can instead use show(...) directly at top level; do not invent a main wrapper for every snippet. Label partial snippets and their required context honestly.

Complete example:
```kafe
drip add(a: INT, b: INT) => INT:
    return a + b;
;
show(add(2, 3));
```
Expected stdout: 5 followed by a newline.

Use -- for a line comment, and -> ... <- for a block comment. Use plain ASCII source punctuation and spaces in copied code, not Markdown emphasis or escaped multiplication. Multiplication is *, division is /, exponentiation is ^. Boolean literals are True and False; equality is ==; logical operators are &&, || and !.

Imports use import libraryName; and library calls use libraryName.function(arguments). Library names and public APIs are case-sensitive. Use the current validated knowledge pack or an exact bundled fixture for library-specific names and arguments. Do not borrow Python, JavaScript, NumPy, pandas or scikit-learn APIs merely because KAFE is implemented in Python or uses similar concepts. If an API or capability is not supported by available references, explain the uncertainty and request the matching documentation instead of inventing runnable code.

Before offering KAFE code, check the output function, declared names, types, block/statement terminators, and intended invocation against the supplied references. Distinguish syntax evidence, expected fixture behavior, and actual execution results. A syntactically valid program can still be incorrect or do nothing. A matching test does not prove a newly generated program correct. Never claim a proposed program ran, passed tests, was applied, or is correct without matching host evidence. Some KAFE runtime errors currently use exit code zero, so expected output and diagnostics matter too.
