# Operational semantics

KAFE semantics are described using **Big-Step Operational Semantics**.

---

## Program state

The state is defined by the tuple **⟨ρ, σ⟩**:

| Component | Symbol | Description |
|------------|---------|-------------|
| **Environment** | ρ (rho) | Maps identifiers to memory locations or direct values |
| **Store** | σ (sigma) | Holds data for mutable structures such as lists and GESHA objects |

---

## Evaluation judgment

> **⟨e, ρ, σ⟩ ⇓ ⟨v, σ'⟩**

This states that expression `e`, in environment `ρ` and store `σ`, evaluates to value `v` and produces a new store `σ'`.

---

## Semantic rules

### Literals

```
⟨n, ρ, σ⟩ ⇓ ⟨n, σ⟩      (where n is a numeric literal)
⟨s, ρ, σ⟩ ⇓ ⟨s, σ⟩      (where s is a string literal)
⟨b, ρ, σ⟩ ⇓ ⟨b, σ⟩      (where b is a boolean literal)
```

### Variables

```
ρ(x) = v
─────────────────
⟨x, ρ, σ⟩ ⇓ ⟨v, σ⟩
```

### Assignment

```
⟨e, ρ, σ⟩ ⇓ ⟨v, σ'⟩    ρ' = ρ[x ↦ loc]    σ'' = σ'[loc ↦ v]
─────────────────────────────────────────────────────────────
⟨x = e, ρ, σ⟩ ⇓ ⟨v, σ''⟩
```

### Arithmetic operations

```
⟨e1, ρ, σ⟩ ⇓ ⟨v1, σ'⟩    ⟨e2, ρ, σ'⟩ ⇓ ⟨v2, σ''⟩
─────────────────────────────────────────────────────
⟨e1 + e2, ρ, σ⟩ ⇓ ⟨v1 + v2, σ''⟩
```

### Conditionals

```
⟨e, ρ, σ⟩ ⇓ ⟨True, σ'⟩    ⟨b1, ρ, σ'⟩ ⇓ ⟨v, σ''⟩
─────────────────────────────────────────────────────
⟨if (e): b1; else: b2;, ρ, σ⟩ ⇓ ⟨v, σ''⟩

⟨e, ρ, σ⟩ ⇓ ⟨False, σ'⟩    ⟨b2, ρ, σ'⟩ ⇓ ⟨v, σ''⟩
─────────────────────────────────────────────────────
⟨if (e): b1; else: b2;, ρ, σ⟩ ⇓ ⟨v, σ''⟩
```

### Functions (closures)

```
ρ' = ρ[f ↦ ⟨e, ρ⟩]
─────────────────────────────────
⟨drip f(x) => T: e;, ρ, σ⟩ ⇓ ⟨closure, ρ'⟩
```

### Function application

```
ρ(f) = ⟨e, ρf⟩    ρf' = ρf[x ↦ v]    ⟨e, ρf', σ⟩ ⇓ ⟨v', σ'⟩
─────────────────────────────────────────────────────────────
⟨f(v), ρ, σ⟩ ⇓ ⟨v', σ'⟩
```

### Currying

```
⟨f, ρ, σ⟩ ⇓ ⟨partial_closure, σ⟩    k < n (missing arguments)
─────────────────────────────────────────────────────────────
⟨f(a1...ak), ρ, σ⟩ ⇓ ⟨new_closure, σ⟩
```

---

## Evaluation strategy

- **Eager evaluation**: All expressions and arguments are evaluated completely before they are used.
- **Left-to-right order**: Operands and arguments are evaluated from left to right.

---

## Environment and scope

| Concept | Description |
|----------|-------------|
| **Global environment** | Variables declared outside functions |
| **Local environment** | Variables inside functions or blocks |
| **Environment closure** | Functions capture ρ when they are defined (shallow copy) |
| **Scope stack** | `scope_stack` manages nested scopes |

---

## Mutation

```
σ(loc) = v_old    ⟨e, ρ, σ⟩ ⇓ ⟨v_new, σ'⟩
─────────────────────────────────────────────
σ'[loc ↦ v_new] updates the store
```

Lists are mutable structures: `list[i] = value` updates the store directly. Strings (STR) are immutable.
