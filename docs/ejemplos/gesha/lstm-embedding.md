# Bidirectional LSTM: token vectors

**Data:** One generated token sequence  
**Program:** [`gesha-lstm-embedding.kf`](../gesha-lstm-embedding.kf)

## What the program teaches

Map token IDs to vectors with `embedding`, run a bidirectional LSTM and pass the result to a sigmoid Dense layer. This is a forward-pass shape demonstration with initialized weights; there is no fitting or accuracy measurement.

## Reading the code

Open the [complete KAFE source](../gesha-lstm-embedding.kf) and follow its imports, input preparation, model construction and output. The linked file is the program to copy or run when you choose to try it; this page is a guide to its purpose.

## Continue learning

[Recurrent networks](../../libraries/gesha/recurrent-networks.md) · [All Gesha examples](../gesha-examples.md)
