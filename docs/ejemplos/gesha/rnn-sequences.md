# RNN: sequence classification

**Data:** Four generated binary sequences  
**Program:** [`gesha-rnn.kf`](../gesha-rnn.kf)

## What the program teaches

Build `SimpleRNN → Dense`, fit on short labeled sequences, then compare predictions. Input is `[samples][timesteps][features]`; each timestep has one feature here.

## Reading the code

Open the [complete KAFE source](../gesha-rnn.kf) and follow its imports, input preparation, model construction and output. The linked file is the program to copy or run when you choose to try it; this page is a guide to its purpose.

## Continue learning

[Recurrent networks](../../libraries/gesha/recurrent-networks.md) · [All Gesha examples](../gesha-examples.md)
