# Semántica Operacional

La semántica de KAFE se describe mediante una **Semántica Operacional de Paso Grande (Big-Step Operational Semantics)**.

---

## Estado del Programa

El estado se define mediante la tupla **⟨ρ, σ⟩**:

| Componente | Símbolo | Descripción |
|------------|---------|-------------|
| **Ambiente** | ρ (rho) | Mapeo de identificadores a posiciones de memoria o valores directos (*Environment*) |
| **Memoria** | σ (sigma) | Almacén de datos para estructuras mutables como listas y objetos GESHA (*Store*) |

---

## Juicio de Evaluación

> **⟨e, ρ, σ⟩ ⇓ ⟨v, σ'⟩**

Indica que la expresión `e`, bajo el ambiente `ρ` y memoria `σ`, se evalúa al valor `v`, resultando en un nuevo estado de memoria `σ'`.

---

## Reglas Semánticas

### Literales

```
⟨n, ρ, σ⟩ ⇓ ⟨n, σ⟩      (donde n es un literal numérico)
⟨s, ρ, σ⟩ ⇓ ⟨s, σ⟩      (donde s es un literal string)
⟨b, ρ, σ⟩ ⇓ ⟨b, σ⟩      (donde b es un literal booleano)
```

### Variables

```
ρ(x) = v
─────────────────
⟨x, ρ, σ⟩ ⇓ ⟨v, σ⟩
```

### Asignación

```
⟨e, ρ, σ⟩ ⇓ ⟨v, σ'⟩    ρ' = ρ[x ↦ loc]    σ'' = σ'[loc ↦ v]
─────────────────────────────────────────────────────────────
⟨x = e, ρ, σ⟩ ⇓ ⟨v, σ''⟩
```

### Operaciones Aritméticas

```
⟨e1, ρ, σ⟩ ⇓ ⟨v1, σ'⟩    ⟨e2, ρ, σ'⟩ ⇓ ⟨v2, σ''⟩
─────────────────────────────────────────────────────
⟨e1 + e2, ρ, σ⟩ ⇓ ⟨v1 + v2, σ''⟩
```

### Condicionales

```
⟨e, ρ, σ⟩ ⇓ ⟨True, σ'⟩    ⟨b1, ρ, σ'⟩ ⇓ ⟨v, σ''⟩
─────────────────────────────────────────────────────
⟨if (e): b1; else: b2;, ρ, σ⟩ ⇓ ⟨v, σ''⟩

⟨e, ρ, σ⟩ ⇓ ⟨False, σ'⟩    ⟨b2, ρ, σ'⟩ ⇓ ⟨v, σ''⟩
─────────────────────────────────────────────────────
⟨if (e): b1; else: b2;, ρ, σ⟩ ⇓ ⟨v, σ''⟩
```

### Funciones (Closures)

```
ρ' = ρ[f ↦ ⟨e, ρ⟩]
─────────────────────────────────
⟨drip f(x) => T: e;, ρ, σ⟩ ⇓ ⟨closure, ρ'⟩
```

### Aplicación de Función

```
ρ(f) = ⟨e, ρf⟩    ρf' = ρf[x ↦ v]    ⟨e, ρf', σ⟩ ⇓ ⟨v', σ'⟩
─────────────────────────────────────────────────────────────
⟨f(v), ρ, σ⟩ ⇓ ⟨v', σ'⟩
```

### Currificación

```
⟨f, ρ, σ⟩ ⇓ ⟨closure_parcial, σ⟩    k < n (argumentos faltantes)
─────────────────────────────────────────────────────────────
⟨f(a1...ak), ρ, σ⟩ ⇓ ⟨nuevo_closure, σ⟩
```

---

## Estrategia de Evaluación

- **Eager Evaluation**: Todas las expresiones y argumentos se evalúan completamente antes de ser utilizados
- **Orden Left-to-Right**: Los operandos y argumentos se evalúan de izquierda a derecha

---

## Ambiente y Alcance

| Concepto | Descripción |
|----------|-------------|
| **Ambiente Global** | Variables declaradas fuera de funciones |
| **Ambiente Local** | Variables dentro de funciones/bloques |
| **Cierre del Ambiente** | Las funciones capturan ρ en el momento de definición (shallow copy) |
| **Pila de Scopes** | `scope_stack` gestiona anidamiento de ámbitos |

---

## Mutación

```
σ(loc) = v_old    ⟨e, ρ, σ⟩ ⇓ ⟨v_new, σ'⟩
─────────────────────────────────────────────
σ'[loc ↦ v_new] actualiza la memoria
```

Las listas son estructuras mutables: `lista[i] = val` modifica la memoria directamente. Las cadenas (STR) son inmutables.
