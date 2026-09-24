grammar Kafe_Grammar;

import Kafe_Lexer;

program
    : (simpleImport SEMI)* (stmt SEMI)*
    ;

simpleImport: IMPORT ID;

stmt
    : varDecl
    | assignStmt
    | indexedAssignStmt
    | functionDecl
    | ifElseExpr
    | whileLoop
    | forLoop
    | returnStmt
    | showStmt
    | appendCall
    | removeCall
    | expr
    ;

block
    : (stmt SEMI)*
    ;

// ======================  LIBRARIES ======================
object
    : ID '.' ID LPAREN ( expr ( COMMA expr )* )? RPAREN    # objectFunctionCall
    | ID '.' ID                                            # objectConstant
    ;

// ======================  VARIABLES ======================
varDecl
    : typeDecl ID (ASSIGN expr)?
    ;

assignStmt
    : ID ASSIGN expr
    ;

indexedAssignStmt
    : ID indexing ASSIGN expr
    ;

indexing
    : (LBRACK expr RBRACK)+
    ;

// ======================  FUNCTIONS ======================
functionDecl
    : DRIP ID '(' paramList? ')' ARROW typeDecl COLON block
    ;


paramList
    : paramDecl (COMMA paramDecl)*
    ;

paramDecl : ID COLON typeDecl   # simpleParam;

functionParam: FUNC LPAREN paramList_typeDecl? RPAREN ARROW typeDecl;
paramList_typeDecl : typeDecl (COMMA typeDecl)*;

 // Curryable calls:   f(args) (args)*
functionCall
    : ID LPAREN argList? RPAREN (LPAREN argList? RPAREN)*
    ;

argList
    : arg (COMMA arg)*
    ;

arg
    : expr        # exprArgument
    | lambdaExpr  # lambdaArgument
    ;

lambdaExpr
    : LPAREN paramList RPAREN ARROW expr
    ;

returnStmt
    : RETURN expr
    ;

showStmt
    : SHOW LPAREN expr RPAREN
    ;
pourStmt
    : POUR LPAREN expr RPAREN
    ;
appendCall: APPEND '(' expr ',' expr ')' ;
removeCall: REMOVE '(' expr ',' expr ')' ;
lenCall: LEN '(' expr ')' ;


// ======================  CONDITIONALS ======================
ifElseExpr
    : IF LPAREN expr RPAREN COLON block (elifBranch)* (ELSE COLON block)?
    ;
elifBranch
    : ELIF LPAREN expr RPAREN COLON block
    ;

// ======================  LOOPS ======================
whileLoop
    : 'while' LPAREN expr RPAREN COLON block
    ;
forLoop
    : 'for' LPAREN ID 'in' expr RPAREN COLON block
    ;

// ======================  EXPRESSIONS ======================
expr
    : logicExpr
    ;

logicExpr
    : equalityExpr ((OR | AND) equalityExpr)*
    ;
equalityExpr
    : relationalExpr ((EQ | NEQ) relationalExpr)*
    ;
relationalExpr
    : additiveExpr ((LT | LE | GT | GE) additiveExpr)*
    ;
additiveExpr
    : multiplicativeExpr ((ADD | SUB) multiplicativeExpr)*
    ;
multiplicativeExpr
    : powerExpr ((MUL | DIV | MOD) powerExpr)*
    ;
powerExpr
    : unaryExpr (POW unaryExpr)*
    ;
unaryExpr
    : (SUB | NOT) unaryExpr    # unaryExpression
    | primaryExpr              # primaryExpression
    ;

// ======================  PRIMARY EXPRESSIONS ======================
primaryExpr
    : primaryExpr LBRACK expr RBRACK           # indexingExpr
    | object                                   # objectExpr
    | functionCall                             # functionCallExpr
    | pourStmt                                 # pourExpr
    | lenCall                                  # lenCallExpr
    | RANGE '(' expr (COMMA expr)? (COMMA expr)? ')' # rangeExpr
    | INT_CAST LPAREN expr RPAREN              # intCastExpr
    | FLOAT_CAST LPAREN expr RPAREN            # floatCastExpr
    | STR_CAST LPAREN expr RPAREN              # strCastExpr
    | BOOL_CAST LPAREN expr RPAREN             # boolCastExpr
    | lambdaExpr                               # lambdaExpression
    | literal                                  # literalExpr
    | ID                                       # idExpr
    | LPAREN expr RPAREN                       # parenExpr
    ;

// ======================  LITERALS ======================
literal
    : INT         # intLiteral
    | FLOAT       # floatLiteral
    | STRING      # stringLiteral
    | BOOL        # boolLiteral
    | listLiteral # listLiteralExpr
    ;

listLiteral
    : LBRACK (expr (COMMA expr)*)? RBRACK
    ;

// ======================  TYPES ======================
typeDecl
    : INT_TYPE
    | FLOAT_TYPE
    | BOOL_TYPE
    | VOID_TYPE
    | STRING_TYPE
    | GESHA_TYPE
    | PARDOS_TYPE
    | MACHINE_TYPE
    | LIST LBRACK typeDecl RBRACK
    | functionParam
    ;
