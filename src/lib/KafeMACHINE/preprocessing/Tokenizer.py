"""Tokenizer: convierte textos en secuencias de índices enteros.

Puente entre el texto crudo y la capa ``Embedding`` de GESHA, que solo
acepta índices de vocabulario (``List[INT]``). La codificación es la
clásica *word index*:

- El texto se pasa a minúsculas y se divide en tokens separados por
  cualquier carácter no alfanumérico (sin *stemming* ni *stop-words*:
  la tokenización queda deliberadamente simple y reproducible).
- Cada token se sustituye por su índice en el vocabulario. El índice 0
  queda reservado (padding/neutral) y nunca se asigna a una palabra.
- Si se configura ``oov_token``, ocupa el índice 1 y las palabras
  desconocidas se mapean a él; sin OOV, las desconocidas se ignoran.
- ``num_words`` acota el vocabulario a las N palabras más frecuentes.

Fundamento: dado un corpus, se cuenta la frecuencia
:math:`f(w)` de cada token :math:`w` y se ordena por
``(-frecuencia, primera aparición)`` para que dos ejecuciones sobre los
mismos datos produzcan SIEMPRE el mismo vocabulario (determinismo).
"""
import re

from global_utils import check_sig
from TypeUtils import lista_cadenas_t, obtener_tipo_dato
from ..BaseMachine import BaseMachine


def _tokenize(text):
    """Divide un texto en minúsculas por cualquier carácter no alfanumérico.

    ``re.split(r"[^a-z0-9]+", text.lower())`` parte en secuencias de no
    alfanuméricos (espacios, puntuación, acentos…); los trozos vacíos se
    descartan. Por ejemplo: ``"¡Qué bueno!"`` -> ``["qu", "bueno"]``.
    """
    return [
        token for token in re.split(r"[^a-z0-9]+", text.lower()) if token
    ]


class Tokenizer(BaseMachine):
    """Transformer texto -> List[List[INT]] con vocabulario determinista.

    Atributos públicos (estilo scikit-learn) tras ``fit``:

    - ``word_index`` (dict STR -> INT): índice de cada token, ordenado por
      (-frecuencia, primera aparición). El índice 0 no aparece: está
      reservado.
    - ``index_word`` (dict INT -> STR): diccionario inverso.
    - ``vocabulary_size`` (INT): total de índices usados, contando el 0
      reservado y el OOV si existe; es el ``input_dim`` que necesita
      ``geshaDeep.embedding``.
    """

    def __init__(self, num_words=0, oov_token=""):
        super().__init__()
        if type(num_words) is not int or num_words < 0:
            raise Exception(
                "Tokenizer: 'num_words' debe ser un entero mayor o igual que 0; "
                f"se recibió {num_words!r}."
            )
        if not isinstance(oov_token, str):
            raise Exception(
                "Tokenizer: 'oov_token' debe ser STR; "
                f"se recibió {obtener_tipo_dato(oov_token)}."
            )
        self.num_words = num_words
        self.oov_token = oov_token
        self.word_index = {}
        self.index_word = {}
        self.vocabulary_size = 1

    def _validate_texts(self, texts, method):
        """Valida que ``texts`` sea una lista no vacía de STR (mensajes en español)."""
        if not texts:
            raise Exception(
                f"Tokenizer: '{method}' necesita al menos un texto; la lista está vacía."
            )
        for posicion, texto in enumerate(texts):
            if not isinstance(texto, str):
                raise Exception(
                    "Tokenizer: cada texto debe ser STR; el elemento "
                    f"{posicion} es {obtener_tipo_dato(texto)}."
                )

    @check_sig([2], lista_cadenas_t, is_method=True)
    def fit(self, texts):
        """Construye el vocabulario a partir de una lista de textos (STR).

        Un Tokenizer ya ajustado se reajusta desde cero: el nuevo
        vocabulario sustituye por completo al anterior (sin estado
        residual). Retorna ``self`` para encadenar ``fit().transform()``.
        """
        self._validate_texts(texts, "fit")

        frecuencias = {}
        primera_aparicion = {}
        contador = 0
        for texto in texts:
            for token in _tokenize(texto):
                if token not in frecuencias:
                    frecuencias[token] = 0
                    primera_aparicion[token] = contador
                frecuencias[token] += 1
                contador += 1

        orden = sorted(
            frecuencias, key=lambda token: (-frecuencias[token], primera_aparicion[token])
        )
        num_palabras = len(orden) if self.num_words == 0 else min(self.num_words, len(orden))

        indices = {}
        if self.oov_token:
            indices[self.oov_token] = 1
        siguiente = 2 if self.oov_token else 1
        for token in orden[:num_palabras]:
            indices[token] = siguiente
            siguiente += 1

        self.word_index = indices
        self.index_word = {indice: token for token, indice in indices.items()}
        self.vocabulary_size = siguiente
        self._is_fitted = True
        return self

    @check_sig([2], lista_cadenas_t, is_method=True)
    def transform(self, texts):
        """Convierte textos en secuencias de índices (List[List[INT]]).

        Requiere ``fit`` previo. Una lista vacía retorna una lista vacía.
        Las palabras desconocidas se mapean al índice de ``oov_token`` si
        está configurado; en caso contrario se ignoran (no se agregan al
        vocabulario). Retorna la lista de secuencias, una por texto.
        """
        self._check_fitted("transform")
        if not texts:
            return []
        self._validate_texts(texts, "transform")

        secuencias = []
        for texto in texts:
            secuencia = []
            for token in _tokenize(texto):
                indice = self.word_index.get(token)
                if indice is None:
                    if not self.oov_token:
                        continue
                    indice = self.word_index[self.oov_token]
                secuencia.append(indice)
            secuencias.append(secuencia)
        return secuencias

    def fit_transform(self, texts):
        return self.fit(texts).transform(texts)

    def __repr__(self):
        return (
            f"Tokenizer(vocabulary_size={self.vocabulary_size}, "
            f"num_words={self.num_words}, oov_token={self.oov_token!r})"
        )
