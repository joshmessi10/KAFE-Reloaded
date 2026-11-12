# GESHA: recurrent networks and sequences

**Recurrent networks** (RNNs) are made for **sequences**: temperatures day after day, the words of a sentence, the notes of a song. They read one element at a time and carry a **memory** of what they've already seen.

## The recurrent network: read and remember { #rnn }

### The idea in one sentence

An RNN uses **the same cell** at every step. The cell receives that step's input **and its previous memory** (the **hidden state** $h$), and produces a new memory. At the end, the last memory summarises the whole sequence.

### An everyday comparison

When you read a story, you don't understand it word by word in isolation: you interpret each new word with what you **remember** of the previous ones. When you finish, you have a summary in your head.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/gesha-rnn-unrolled.svg"
<figcaption>Three copies of the same RNN cell, one per step. The values 0.1, 0.2 and 0.3 enter one at a time from below. After each step, the cell passes its memory (the hidden state h) to the right. After the third step, the final memory goes up to the output, which says the series is rising.</figcaption>
</figure>

A sequence in KAFE is `[steps][features]`: a list of steps, and at each step a list of numbers. The series `0.1, 0.2, 0.3` is `[[0.1], [0.2], [0.3]]`: 3 steps of 1 feature.

### Your first recurrent network { #first-rnn }

Is the series **rising** (`1`) or **falling** (`0`)?

```kafe
--8<-- "tests/DocsExamples/gesha/rnn-trend.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/rnn-trend.expec"
```

!!! tip "What happened here?"
    1. `gesha.create_rnn(4, "tanh", [3, 1], False, 5)` creates a cell with **4** memory numbers, `"tanh"` activation, for sequences of **3 steps of 1 feature**. `False` means "return only the last memory".
    2. A `"sigmoid"` neuron reads that memory and decides.
    3. In 10 epochs the loss drops to `0.0219`. It gets the 6 series right, and two new ones: `0.3, 0.5, 0.8` rises and `0.7, 0.4, 0.0` falls.

### Only the last memory, or all of them? { #return-sequences }

```kafe
--8<-- "tests/DocsExamples/gesha/rnn-shapes.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/rnn-shapes.expec"
```

With `False`, the layer returns **one** memory of `4` numbers. With `True` it returns **one per step**: `[3, 4]`. Use `True` when the next layer is also recurrent and needs the whole sequence.

??? info "For the curious 🤓"
    The simple cell computes $h_t = \tanh(W_x x_t + W_h h_{t-1} + b)$, with **the same** $W_x$, $W_h$ and $b$ at every step. To train, the network is "unrolled" as in the picture and the gradient travels back through every step (*backpropagation through time*). In long sequences, that gradient gets multiplied many times and can shrink until it vanishes or grow out of control. That's why LSTM and GRU exist.

## LSTM and GRU: memory with gates { #gates }

**LSTM** (*Long Short-Term Memory*) and **GRU** (*Gated Recurrent Unit*) add **gates**: small sigmoid neurons that decide, at each step, **how much to forget**, **how much to store** and **how much to show** of the memory. That way they remember things from many steps back.

| Layer | Mechanism | Use it for |
|---|---|---|
| `gesha.create_rnn(units, activation, [T, F], all, seed)` | Simple memory. | Short sequences. |
| `gesha.create_lstm(units, [T, F], all, seed)` | Input, forget and output gates. | Long dependencies. |
| `gesha.create_gru(units, [T, F], all, seed)` | Update and reset gates (fewer than LSTM). | The same, with fewer parameters. |
| `gesha.bidirectional(layer)` | Reads the sequence forwards and backwards and joins both memories. | When you have the whole sequence (for example, a sentence). Doubles the size: `2 × units`. |

??? info "For the curious 🤓"
    In an LSTM, the forget gate $f_t = \sigma(W_f[h_{t-1}, x_t] + b_f)$ multiplies the previous memory $c_{t-1}$; the input gate $i_t$ decides how much of the new proposal $\tilde{c}_t = \tanh(\ldots)$ is added: $c_t = f_t \odot c_{t-1} + i_t \odot \tilde{c}_t$; and the output gate $o_t$ decides what is shown: $h_t = o_t \odot \tanh(c_t)$. Since $c_t$ is updated by **adding**, the gradient can travel far without vanishing.

## Embedding: words as vectors { #embedding }

### The idea in one sentence

A network doesn't understand words. A [Tokenizer](../machine/preprocessing.md#tokenizer) turns them into numbers (`"cat"` → `4`), and an **Embedding** layer turns each number into a **vector** that is learned: words used in similar ways end up with similar vectors.

```kafe
--8<-- "tests/DocsExamples/gesha/rnn-embedding.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/rnn-embedding.expec"
```

`gesha.embedding(5, 3, 7)` accepts numbers 0 to 4 and gives a vector of **3** numbers per word. The sentence `[2, 4, 2]` becomes 3 vectors, and word `2` always gets **the same** vector (`True`).

??? warning "Common mistake: a number outside the vocabulary"
    ```kafe
    --8<-- "tests/DocsExamples/gesha/rnn-embedding-range.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/gesha/rnn-embedding-range.error.stderr.expec"
    ```

## Layers for merging branches { #merge }

| Function | What it does |
|---|---|
| `gesha.add_layer()` | Adds two inputs element by element ("shortcut" connections). |
| `gesha.concatenate_layer(axis)` | Joins several inputs side by side. |
| `gesha.multiply_layer()` | Multiplies two inputs element by element. |

They're used with `gesha.functional` models (see [models and training](models-training.md#details)).

## Preparing sequences { #data }

1. Build windows with the same number of steps and features.
2. For forecasting, split by **time**: train on the past and test on the future. A random split lets the future leak in.
3. Fit the scaling or the vocabulary **only** on the training data.
4. To predict **one** sequence, wrap it: `model.predict([sequence])`.

Complete examples: [temperatures with an RNN](../../ejemplos/gesha/rnn-temperature.md) and [sentiment with Embedding and RNN](../../ejemplos/gesha/rnn-sentiment.md).

## Technical details { #details }

- An RNN/LSTM/GRU sample is `[T, F]`; the final output is `[units]` and with all memories it's `[T, units]`.
- `bidirectional` only wraps SimpleRNN, LSTM or GRU.
- Each Embedding index must be between 0 and `input_dim − 1`; the output is `[T, output_dim]`.
- The layers have no `stateful`, `return_state`, `mask_zero` or built-in dropout: every sequence starts with the memory at zero.
- The cost grows with the sequence length; LSTM and GRU have more parameters than a simple RNN.

| 👍 Strengths | 👎 Limits |
|---|---|
| They read sequences of any length with the same weights. | Slow: they process one step at a time. |
| LSTM and GRU remember what matters for a long time. | The simple RNN forgets quickly in long sequences. |
