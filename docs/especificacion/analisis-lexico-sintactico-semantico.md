# Análisis Léxico, Sintáctico y Semántico

KAFE se define técnicamente como un lenguaje **interpretado híbrido basado en el patrón Visitor**. Su modelo de ejecución sigue un pipeline secuencial de tres fases.

---

## Pipeline de Ejecución

```
┌──────────────────────────────────────────────────────────┐
│                    Código Fuente (.kf)                    │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  FASE 1: ANÁLISIS LÉXICO (Lexer - Kafe_Lexer.g4)        │
│  Tokeniza el flujo de caracteres en tokens               │
│  Entrada: "INT x = 5;" → Tokens: [INT, x, =, 5, ;]    │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  FASE 2: ANÁLISIS SINTÁCTICO (Parser - Kafe_Grammar.g4) │
│  Genera un Árbol de Sintaxis Abstracta (AST)            │
│  Valida la gramática EBNF del lenguaje                  │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  FASE 3: ANÁLISIS SEMÁNTICO Y EJECUCIÓN                  │
│  (Visitor - EvalVisitorPrimitivo.py)                     │
│  Recorre el AST, chequea tipos y evalúa expresiones     │
│  Resultado: Ejecución directa del programa              │
└──────────────────────────────────────────────────────────┘
```

---

## Fase 1: Análisis Léxico

**Archivo**: `Kafe_Lexer.g4`

El Lexer convierte el código fuente en una secuencia de tokens usando ANTLR4.

### Definición de Tokens

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

-- Comentarios (se ignoran)
LINE_COMMENT  : '--' ~[\r\n]* -> skip;
BLOCK_COMMENT : '->' ( BLOCK_COMMENT | ~[<] | '<' ~[-] )* '<-' -> skip;
```

### Ejemplo de Tokenización

```
Código:  INT x = 5 + 3;
Tokens: [INT_TYPE, ID("x"), ASSIGN, INT("5"), ADD, INT("3"), SEMI]
```

---

## Fase 2: Análisis Sintáctico

**Archivo**: `Kafe_Grammar.g4`

El Parser valida la estructura del código contra la gramática y genera un AST.

### Reglas Principales

```
program   : (simpleImport SEMI)* (stmt SEMI)*;

stmt      : varDecl | assignStmt | functionDecl
          | ifElseExpr | whileLoop | forLoop
          | returnStmt | showStmt | expr;

varDecl   : typeDecl ID (ASSIGN expr)?;
expr      : logicExpr;
logicExpr : equalityExpr ((OR | AND) equalityExpr)*;
-- ... (precedencia de operadores en reglas encadenadas)
```

### Generación del AST

```python
# En Kafe.py (punto de entrada)
input_stream = InputStream(contenido)
lexer = Kafe_GrammarLexer(input_stream)
tokens = CommonTokenStream(lexer)
parser = Kafe_GrammarParser(tokens)
tree = parser.program()  # AST root
```

---

## Fase 3: Análisis Semántico y Ejecución

**Archivo**: `EvalVisitorPrimitivo.py`

Un Visitor recorre el AST realizando:

1. **Chequeo de tipos dinámico** (en tiempo de ejecución)
2. **Evaluación de expresiones**
3. **Ejecución de sentencias**

### Patrón Visitor

```python
class EvalVisitorPrimitivo(Kafe_GrammarVisitor):
    def __init__(self):
        self.variables = {}           # Almacén de variables
        self.scope_stack = [{}]       # Pila de ámbitos
        self.libraries = {            # Librerías disponibles
            "numk": [...], "math": [...], ...
        }

    def visitVarDecl(self, ctx):
        # Declara variable con tipo
        ...

    def visitFunctionCall(self, ctx):
        # Llama función con soporte de currificación
        ...
```

### Gestión de Ámbitos

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

## Motor de Parseo ANTLR4

KAFE utiliza un motor **LL(*)** que resuelve ambigüedades mediante:

1. **Precedencia Estática**: Definida por el orden de reglas en la gramática
2. **Máxima Coincidencia (Greedy)**: El lexer construye el token más largo posible
3. **Backtracking Limitado**: ANTLR4 usa lookahead adaptativo

---

## Manejo de Errores en el Pipeline

| Fase | Tipo de Error | Ejemplo |
|------|---------------|---------|
| **Léxico** | Token no reconocido | Carácter inválido en código |
| **Sintáctico** | Estructura inválida | `INT = 5;` (falta identificador) |
| **Semántico** | Tipo incorrecto | `INT x = "hola";` |
| **Runtime** | Error de ejecución | `x / 0`, índice fuera de rango |

### Custom Error Listener

```python
class KafeErrorListener(ErrorListener):
    def syntaxError(self, recognizer, offendingSymbol, line, column, msg, e):
        if "token recognition error" in msg:
            raise Exception(f"SyntaxError: unterminated string at {line}:{column}")
        raise Exception(f"SyntaxError at {line}:{column} -> {msg}")
```
