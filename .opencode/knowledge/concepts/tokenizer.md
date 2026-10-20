# Tokenizer

## Name

Tokenizer (text → index sequences)

## Category

ML preprocessing (library utility)

## Description

Un tokenizer convierte texto crudo en una secuencia de índices enteros.
Dada una colección de documentos, construye un vocabulario de tokens
(palabras) y asigna a cada token un índice entero único. `transform`
devuelve, para cada documento, la lista de índices de sus tokens. Es el
puente obligado entre el mundo del lenguaje natural (cadenas) y el mundo
de las redes neuronales (números): la capa `Embedding` de KafeGESHA
exige `List[INT]` — índices de vocabulario — no vectores one-hot.

## Mathematical Foundation

Sea el corpus $D = \{d_1, \ldots, d_n\}$ con tokens $w \in d_i$. El
vocabulario $V$ es el conjunto de tokens únicos, con frecuencia

$$f(w) = \#\{d_i : w \in d_i\}.$$

La función de indexación $\varphi: V \cup \{\text{OOV}\} \to \{0, \ldots, |V|\}$
asigna índices de forma determinista:

- $\varphi(\text{<pad>}) = 0$ (índice reservado, no aprendido de datos);
- si `oov_token` está configurado, $\varphi(\text{OOV}) = 1$;
- los tokens reales ocupan $\{1 \text{ o } 2, \ldots\}$ en orden de
  $(-f(w), \text{posición de primera aparición})$: primero los más
  frecuentes; a igual frecuencia, el que aparece antes gana.

$\varphi$ es inyectiva por construcción. `num_words = m` acota el
vocabulario: solo se conservan los $m$ primeros tokens del orden
$(-f(w), \text{primera aparición})$; el resto se mapea al índice de OOV
(si existe) o se descarta.

Sin embeddings preentrenados, el `Embedding` **es** la representación
aprendida: cada índice $j$ se mapea a una fila $\mathbf{e}_j$ de la
matriz $E \in \mathbb{R}^{|V| \times d}$ que se entrena junto con la red.

- **Time Complexity**: $O(\sum_i |d_i|)$ para `fit` (tokenizar y contar)
  y para `transform`; el ordenamiento del vocabulario cuesta
  $O(|V| \log |V|)$ una sola vez en `fit`.
- **Space Complexity**: $O(|V|)$ para los diccionarios
  `word_index`/`index_word`.
- **Key Formulas**: orden del vocabulario
  $\text{key}(w) = (-f(w), \text{first\_pos}(w))$;
  mapeo $\varphi(w)$ como arriba.

## Step-by-Step Algorithm

### `fit(texts)`

1. Para cada documento de `texts`, convertir a minúsculas y separar en
   tokens con la expresión regular `[^0-9a-zA-Z]+` (todo lo no
   alfanumérico es separador).
2. Contar frecuencia $f(w)$ de cada token y registrar su posición de
   primera aparición.
3. Ordenar los tokens por `(-f(w), primera aparición)`.
4. Asignar índices: 0 reservado (`<pad>`), 1 a OOV si `oov_token` está
   configurado, y los siguientes a los tokens reales en orden, hasta
   `num_words` si se indicó (en caso contrario, todos).

### `transform(texts)`

1. Para cada documento, tokenizar igual que en `fit`.
2. Reemplazar cada token por $\varphi(w)$: tokens fuera del vocabulario
   (o que exceden `num_words`) usan el índice de OOV si existe; si no
   existe OOV, se descartan silenciosamente.
3. Retornar `List[List[INT]]`, una secuencia por documento.

## Motivation

Las redes neuronales operan sobre números y `gesha.embedding` exige
`List[INT]` como entrada. Sin un tokenizador no existía ninguna forma
KAFE-native de llevar un corpus de texto (p. ej. el dataset de sentimiento
Yelp de Kaggle, `.txt` con TAB sin encabezado) a las secuencias de
índices que la Embedding transforma en vectores aprendidos. El
one-hot-ing directo de palabras sería imposible en la práctica
($|V|$ dimensiones por token), mientras que un índice es $O(1)$.

## Advantages

- **Determinismo**: el orden del vocabulario $(-f(w), \text{primera aparición})$
  es reproducible bit a bit entre corridas; los fixtures `.expec` son
  estables.
- **Cero dependencias**: tokenización con `re` de la stdlib; no se
  arrastra NLTK, spaCy ni sklearn (política de dependencias de KAFE).
- **Enlace directo con `Embedding`**: el `vocabulary_size` resultante se
  pasa tal cual a `gesha.embedding(num_embeddings, embedding_dim)`;
  índice 0 reservado evita filas sin significado en $E$.
- **Control de tamaño**: `num_words` acota el vocabulario para datasets
  grandes sin tocar el código del usuario.

## Limitations

- **Sin stemming ni stop-words**: "running" y "run" son tokens distintos;
  "the"/"el" ocupan índices útiles. Se enseña el concepto pero no se
  aplica por defecto.
- **Puntuación y tildes parten palabras**: el separador es
  no-alfanumérico, así que "qué" → ["qu"]; "don't" → ["don", "t"]. Es
  una simplificación deliberada, documentada para que el estudiante la
  conozca.
- **Sin n-gramas**: solo unigramas; no se capturan locuciones.
- **Fuga si se ajusta sobre todo el corpus**: `fit` debe ejecutarse solo
  sobre train; hacerlo con train+test filtra información del test al
  vocabulario (fuga de datos). `src/EjemploRNN2.kf` muestra el patrón
  correcto.

## When to Use

- Corpus de texto que debe alimentar una `gesha.embedding` + RNN/LSTM.
- Clasificación de sentimiento, tópicos u otras tareas de texto con
  vocabulario finito y datasets pequeños/medianos (educativos).

## When NOT to Use

- Features categóricas tabulares (usar `label-encoder` o
  `one-hot-encoder`).
- Corpora donde morfología (stemming, lematización) sea crítica — KAFE
  no la implementa aún.
- Cuando se requieran embeddings preentrenados (word2vec/GloVe); el
  `Embedding` de KAFE aprende $E$ desde cero.

## Dependencies

- BaseMachine (KafeMACHINE), stdlib `re`.
- Consumidores: `gesha.embedding` (KafeGESHA), ingesta
  `kaggle.load_text_dataset` (KafeKaggle).

## Related Concepts

- `one-hot-encoder`, `label-encoder` (otros codificadores numéricos).
- `simple-rnn`, `dense-layer` (consumidores de las secuencias).
- `kaggle-dataset-ingestion` (ruta de texto etiquetado → PARDOS → tokenizer).

## Relationship with KAFE

- Implementado en `src/lib/KafeMACHINE/preprocessing/Tokenizer.py` como
  clase que hereda `BaseMachine` (tipo KAFE `MACHINE`).
- Factory: `machine.tokenizer(num_words=0, oov_token="")` (registrado en
  `src/lib/KafeMACHINE/funciones.py`).
- Métodos `fit(List[STR])`, `transform(List[STR]) -> List[List[INT]]`,
  `fit_transform`; atributos `word_index`, `index_word`,
  `vocabulary_size`.
- Índice 0 reservado; índice 1 es OOV cuando se pasa `oov_token` — misma
  convención que Keras Tokenizer, para que los materiales educativos
  externos apliquen sin traducción.

## Usage Examples

```kafe
import machine;
import gesha;

MACHINE tok = machine.tokenizer(0, "");
List[STR] frases = ["buen café", "mal servicio", "buen ambiente"];
tok.fit(frases);
show(tok.vocabulary_size);
List[List[INT]] seqs = tok.transform(frases);
show(seqs);

MACHINE emb = gesha.embedding(tok.vocabulary_size, 8);
```

## Implementation Location

- `src/lib/KafeMACHINE/preprocessing/Tokenizer.py` — clase `Tokenizer`.
- `src/lib/KafeMACHINE/funciones.py` — factory `machine.tokenizer`.

## Public API

- `machine.tokenizer(num_words=0, oov_token="")` — crea Tokenizer.
- `tok.fit(texts)` — construye el vocabulario.
- `tok.transform(texts)` — texto → `List[List[INT]]`.
- `tok.fit_transform(texts)` — fit + transform.
- `tok.word_index` / `tok.index_word` — mapeos ida y vuelta.
- `tok.vocabulary_size` — |V| efectivo (incluye reservados).

## References

- Keras Tokenizer: https://keras.io/api/layers/preprocessing/text_vectorization/
- scikit-learn CountVectorizer: https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.CountVectorizer.html
- Jurafsky & Martin, *Speech and Language Processing* (NLP preprocessing).
- ADR-0021 (`.opencode/adr/decisions.md`).
- Estado: operativo desde 2026-10-18.
