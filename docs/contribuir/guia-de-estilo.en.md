# Documentation style guide

This guide explains **how we write** the KAFE documentation. The goal is that someone who has never programmed can read any page and understand it.

## Tone

- Short sentences. One idea per sentence.
- We talk to the reader as **you**: "now write…", "you will see…".
- We assume nothing. When we use a new word, we explain it the first time.
- We celebrate progress: every section ends with what the reader can now do.
- We avoid words like "simply", "obviously" or "trivial". What is obvious to the writer is not obvious to the learner.

## How to explain a concept

Every concept always follows this order:

1. **The idea in one sentence.** What it is, without jargon.
2. **An everyday comparison.** A recipe, labeled boxes, a blender…
3. **A drawing or diagram**, when it helps to see the idea.
4. **A small KAFE example you can run.** It is always tested before publishing.
5. **The expected output**, in a `text` block.
6. **"What happened here?"**: a step-by-step explanation of the example.
7. **"What did you learn?"**: a two- or three-point summary.

Formulas and mathematical details come **after** the intuition, inside a collapsible block:

```markdown
??? info "For the curious 🤓"
    The output of a neuron is $y = f(w \cdot x + b)$.
```

## Template for documenting a library function

Every function of every library is documented with this template:

```markdown
### `function_name(param1, param2)`

**What it does:** one simple sentence.

**When to use it:** a real case where it helps.

| Parameter | Type | Meaning |
|---|---|---|
| `param1` | `FLOAT` | … |

**Returns:** the type and what it represents.

**Example:** (runnable KAFE program)

**Result:** (exact output)

**Common mistakes:** what happens if you get it wrong and how to fix it.
```

## Help boxes

| Box | Purpose |
|---|---|
| `!!! tip` | A useful hint or shortcut. |
| `!!! note` | Extra information that is not essential. |
| `!!! warning` | Something that often goes wrong. |
| `??? info "For the curious 🤓"` | Optional math and details. |
| `!!! soon "Coming soon"` | Pages that are still being written. |

## Languages

- Every page exists in Spanish (`page.md`) and English (`page.en.md`).
- If there is no translation yet, the site shows the existing version.
- KAFE code, function names and types are not translated. Variable names in examples may be translated.
