# Análisis léxico, sintáctico y semántico

KAFE es técnicamente un **lenguaje interpretado híbrido basado en el patrón Visitor**. Su modelo de ejecución sigue una tubería (*pipeline*) secuencial de tres etapas.

---

## Tubería de ejecución { #execution-pipeline }

```
┌──────────────────────────────────────────────────────────┐
│                   Código fuente (.kf)                    │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  FASE 1: ANÁLISIS LÉXICO (Lexer - Kafe_Lexer.g4)         │
│  Convierte la secuencia de caracteres en tokens          │
│  Entrada: "INT x = 5;" → Tokens: [INT, x, =, 5, ;]       │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  FASE 2: ANÁLISIS SINTÁCTICO (Parser - Kafe_Grammar.g4)  │
│  Construye el árbol de sintaxis abstracta (AST)          │
│  Valida la gramática del lenguaje                        │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  FASE 3: ANÁLISIS SEMÁNTICO Y EJECUCIÓN                  │
│  (Visitor - InterpreterVisitor.py)                       │
│  Recorre el AST, comprueba tipos y evalúa expresiones    │
│  Resultado: Ejecución directa del programa               │
└──────────────────────────────────────────────────────────┘
```

---

## Fase 1: Análisis léxico { #phase-1-lexical-analysis }

**Archivo**: `Kafe_Lexer.g4`

El analizador léxico (*lexer*) convierte el código fuente en una secuencia ordenada de tokens mediante ANTLR4.

### Definición de tokens

```
-- Palabras clave
DRIP        : 'drip';
SHOW        : 'show';
RETURN      : 'return';
IF          : 'if';
ELIF        : 'elif';
ELSE        : 'else';
FUNC        : 'FUNC';
IMPORT      : 'import';

-- Operadores
ADD         : '+';
SUB         : '-';
MUL         : '*';
DIV         : '/';
MOD         : '%';
POW         : '^';
AND         : '&&';
OR          : '||';
EQ          : '==';
NEQ         : '!=';
ASSIGN      : '=';
NOT         : '!';

-- Tipos
INT_TYPE    : 'INT';
FLOAT_TYPE  : 'FLOAT';
BOOL_TYPE   : 'BOOL';
STRING_TYPE : 'STR';
VOID_TYPE   : 'VOID';
LIST        : 'List';

-- Literales
INT         : [0-9]+;
FLOAT       : [0-9]+ '.' [0-9]+ ([eE] [+-]? [0-9]+)?;
BOOL        : 'True' | 'False';
STRING      : '"' ( ~["\\\r\n] | '\\' . )* '"';

-- Identificadores
ID          : [a-zA-Z_] [a-zA-Z0-9_]*;

-- Comentarios (ignorados)
LINE_COMMENT  : '--' ~[\r\n]* -> skip;
BLOCK_COMMENT : '->' ( BLOCK_COMMENT | ~[<] | '<' ~[-] )* '<-' -> skip;
```

### Ejemplo de tokenización

```
Fuente: INT x = 5 + 3;
Tokens: [INT_TYPE, ID("x"), ASSIGN, INT("5"), ADD, INT("3"), SEMI]
```

---

## Fase 2: Análisis sintáctico { #phase-2-syntax-analysis }

**Archivo**: `Kafe_Grammar.g4`

El analizador sintáctico (*parser*) valida la estructura del código contra las reglas de la gramática y genera el árbol de sintaxis abstracta (AST).

### Reglas principales

```
program   : (simpleImport SEMI)* (stmt SEMI)*;

stmt      : varDecl | assignStmt | functionDecl
          | ifElseExpr | whileLoop | forLoop
          | returnStmt | showStmt | expr;

varDecl   : typeDecl ID (ASSIGN expr)?;
expr      : logicExpr;
logicExpr : equalityExpr ((OR | AND) equalityExpr)*;
-- ... (la precedencia de operadores se codifica en reglas encadenadas)
```

### Generación del AST

```python
# En Kafe.py (punto de entrada)
input_stream = InputStream(source_text)
lexer = Kafe_GrammarLexer(input_stream)
tokens = CommonTokenStream(lexer)
parser = Kafe_GrammarParser(tokens)
tree = parser.program()  # Raíz del AST
```

---

## Fase 3: Análisis semántico y ejecución { #phase-3-semantic-analysis-and-execution }

**Archivo**: `InterpreterVisitor.py`

El visitante (*visitor*) recorre los nodos del AST para ejecutar:

1. **Comprobación dinámica de tipos** (en tiempo de ejecución)
2. **Evaluación de expresiones**
3. **Ejecución de sentencias y control de flujo**

### Patrón Visitor

```python
class InterpreterVisitor(Kafe_GrammarVisitor):
    def __init__(self):
        self.variables = {}           # Almacén de variables
        self.scope_stack = [{}]       # Pila de ámbitos
        self.libraries = {            # Librerías disponibles
            "numk": [...], "math": [...], ...
        }

    def visitVarDecl(self, ctx):
        # Declaración de variable tipada
        ...

    def visitFunctionCall(self, ctx):
        # Llamada a función con soporte de currificación
        ...
```

### Gestión de ámbitos

```python
def push_scope(self):
    self.scope_stack.append({})

def pop_scope(self):
    local_vars = self.scope_stack.pop()
    for var_name in local_vars:
        if var_name in self.variables:
            del self.variables[var_name]
```

---

## Analizador sintáctico ANTLR4 { #antlr4-parser }

KAFE utiliza un analizador **LL(*)** que resuelve ambigüedades mediante:

1. **Precedencia estática**: Determinada por el orden de las reglas en la gramática.
2. **Máxima coincidencia (*maximal munch*)**: El lexer construye el token más largo disponible.
3. **Retroceso acotado (*lookahead* adaptativo)**: ANTLR4 inspecciona símbolos hacia adelante según se requiera.

---

## Manejo de errores en la tubería { #pipeline-error-handling }

| Fase | Tipo de error | Ejemplo |
|---|---|---|
| **Léxica** | Token no reconocido | Carácter inválido en el código |
| **Sintáctica** | Estructura no válida | `INT = 5;` (falta el identificador) |
| **Semántica** | Tipo incompatible | `INT x = "hola";` |
| **Tiempo de ejecución** | Error de ejecución | `x / 0`, índice fuera de rango |

### Oyente de errores personalizado

```python
class KafeErrorListener(ErrorListener):
    def syntaxError(self, recognizer, offendingSymbol, line, column, msg, e):
        if "token recognition error" in msg:
            raise Exception(f"SyntaxError: unterminated string at {line}:{column}")
        raise Exception(f"SyntaxError at {line}:{column} -> {msg}")
```
