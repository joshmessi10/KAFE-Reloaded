# RNN: temperature forecasting

**Data:** Kaggle daily minimum temperatures in Melbourne  
**Program:** [`ejemplo-rnn1-series.kf`](../ejemplo-rnn1-series.kf)

## What the program teaches

Create seven-day windows, split chronologically so future days stay in the test set, fit preprocessing on training data and use a recurrent network to predict the next day's temperature. Evaluate mean absolute error in degrees Celsius. This example needs a dataset download and has a longer training time.

## Reading the code

Open the [complete KAFE source](../ejemplo-rnn1-series.kf) and follow its imports, input preparation, model construction and output. The linked file is the program to copy or run when you choose to try it; this page is a guide to its purpose.

## Continue learning

[Recurrent networks](../../libraries/gesha/recurrent-networks.md) · [All Gesha examples](../gesha-examples.md)
