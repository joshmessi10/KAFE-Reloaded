<section class="kafe-hero">
  <div class="kafe-hero__eyebrow">Aprende · experimenta · comprende</div>
  <h1>KAFE: programa para entender la IA</h1>
  <p>Un lenguaje educativo para explorar programación funcional, machine learning y deep learning desde sus fundamentos.</p>
  <div class="kafe-hero__actions">
    <a href="guia-inicio/instalacion/">Empezar ahora →</a>
    <a href="bibliotecas/machine/">Explorar MACHINE →</a>
  </div>
</section>

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

## Explora la documentación

Usa el menú lateral para abrir las secciones y entrar en cada biblioteca. En pantallas pequeñas, ábrelo con el botón de menú de la barra superior.

<div class="kafe-grid">
  <a class="kafe-card" href="guia-inicio/instalacion/"><strong>01 / Primeros pasos</strong><span>Instala KAFE y ejecuta tu primer programa.</span></a>
  <a class="kafe-card" href="lenguaje/estructura-lexica/"><strong>02 / Lenguaje</strong><span>Conoce la sintaxis, los tipos y las funciones.</span></a>
  <a class="kafe-card" href="bibliotecas/machine/"><strong>03 / MACHINE</strong><span>Explora algoritmos, preprocesamiento y métricas.</span></a>
  <a class="kafe-card" href="bibliotecas/gesha/"><strong>04 / GeshaDeep</strong><span>Construye y comprende redes neuronales.</span></a>
</div>

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
