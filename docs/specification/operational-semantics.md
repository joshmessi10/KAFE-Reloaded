# Semántica operacional

La semántica formal de KAFE se describe mediante **Semántica Operacional de Paso Grande** (*Big-Step Operational Semantics*).

---

## Estado del programa { #program-state }

El estado de ejecución se define mediante la tupla **⟨ρ, σ⟩**:

| Componente | Símbolo | Descripción |
|---|---|---|
| **Entorno** (*environment*) | ρ (rho) | Mapea identificadores a ubicaciones de memoria o valores directos |
| **Memoria** (*store*) | σ (sigma) | Almacena los datos de estructuras mutables como listas y objetos de GESHA |

---

## Juicio de evaluación { #evaluation-judgment }

> **⟨e, ρ, σ⟩ ⇓ ⟨v, σ'⟩**

Esta relación formal establece que la expresión `e`, evaluada bajo el entorno `ρ` y la memoria `σ`, produce el valor `v` y un nuevo estado de memoria `σ'`.

---

## Reglas semánticas { #semantic-rules }

### Literales

```
⟨n, ρ, σ⟩ ⇓ ⟨n, σ⟩      (donde n es un literal numérico)
⟨s, ρ, σ⟩ ⇓ ⟨s, σ⟩      (donde s es una cadena de texto)
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

### Operaciones aritméticas

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

### Funciones (clausuras)

```
ρ' = ρ[f ↦ ⟨e, ρ⟩]
─────────────────────────────────
⟨drip f(x) => T: e;, ρ, σ⟩ ⇓ ⟨closure, ρ'⟩
```

### Aplicación de funciones

```
ρ(f) = ⟨e, ρf⟩    ρf' = ρf[x ↦ v]    ⟨e, ρf', σ⟩ ⇓ ⟨v', σ'⟩
─────────────────────────────────────────────────────────────
⟨f(v), ρ, σ⟩ ⇓ ⟨v', σ'⟩
```

### Currificación

```
⟨f, ρ, σ⟩ ⇓ ⟨partial_closure, σ⟩    k < n (faltan argumentos)
─────────────────────────────────────────────────────────────
⟨f(a1...ak), ρ, σ⟩ ⇓ ⟨new_closure, σ⟩
```

---

## Estrategia de evaluación { #evaluation-strategy }

- **Evaluación voraz (*eager*)**: Todas las expresiones y argumentos se evalúan por completo antes de ser utilizados.
- **Orden de izquierda a derecha**: Los operandos y argumentos se evalúan estrictamente de izquierda a derecha.

---

## Entorno y ámbitos { #environment-and-scope }

| Concepto | Descripción |
|---|---|
| **Entorno global** | Variables declaradas fuera de funciones |
| **Entorno local** | Variables dentro de funciones o bloques |
| **Clausura del entorno** | Las funciones capturan ρ al ser definidas (copia superficial) |
| **Pila de ámbitos** | `scope_stack` gestiona los ámbitos anidados |

---

## Mutación { #mutation }

```
σ(loc) = v_old    ⟨e, ρ, σ⟩ ⇓ ⟨v_new, σ'⟩
─────────────────────────────────────────────
σ'[loc ↦ v_new] actualiza la memoria
```

Las listas (`List`) son estructuras mutables: `list[i] = value` actualiza la memoria directamente. Las cadenas (`STR`), por el contrario, son inmutables.
