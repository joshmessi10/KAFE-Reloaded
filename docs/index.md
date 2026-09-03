# KAFE — Deep Learning Language

**KAFE** es un lenguaje de programación de dominio específico (DSL) diseñado para la comunidad académica, orientado al aprendizaje y desarrollo de redes neuronales artificiales. Su paradigma funcional permite el uso de funciones currificadas, composición funcional y estructuras declarativas, promoviendo una comprensión profunda del funcionamiento interno de los modelos neuronales.

---

## Características Principales

- **Paradigma Funcional**: Funciones de primer orden, currificación nativa, lambdas y closures
- **Tipado Estático Explícito**: Tipos primitivos, listas genéricas, funciones tipadas
- **Librerías Integradas**: Álgebra lineal, visualización, Deep Learning, DataFrames, ML
- **Sintaxis Clara**: Diseñada para ser legible y expresiva en contextos educativos

---

## Ejemplo Rápido

```kafe
-- Fibonacci con recursión
drip fibonacci(n: INT) => INT:
    if (n <= 1):
        return n;
    ;
    return fibonacci(n - 1) + fibonacci(n - 2);
;

show(fibonacci(7));  -- 13
```

---

## Navegación

| Sección | Descripción |
|---------|-------------|
| [**Guía de Inicio**](guia-inicio/instalacion.md) | Instalación, primeros pasos y ejemplos básicos |
| [**Lenguaje**](lenguaje/estructura-lexica.md) | Referencia completa del lenguaje: tipos, operadores, funciones |
| [**Bibliotecas**](bibliotecas/numk.md) | Documentación de NUMK, MATH, PLOT, FILES, GeshaDeep, PARDOS, MACHINE |
| [**Especificación**](especificacion/gramatica-ebnf.md) | Gramática formal EBNF, semántica operacional, pipeline de ejecución |
| [**Errores**](errores/tipos-error.md) | Referencia completa del sistema de errores |
| [**Ejemplos**](ejemplos/hola-mundo.kf) | Programas de ejemplo progresivos |

---

## Información del Proyecto

- **Versión**: v2.0.0
- **Licencia**: GPL-3.0
- **Repositorio**: [GitHub](https://github.com/joshmessi10/KAFE-Reloaded)
- **Autores**: Josh Sebastián López Murcia, Franklin Julián González Pérez, Karen Yireth Castañeda
- **Coautores**: Andrés Felipe Sindicue, Luis Felipe Valencia, Emanuel Felipe Molina
- **Asesor**: Joaquín Sánchez — Universidad Sergio Arboleda
