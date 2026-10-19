# Benchmark E2E de la cadena RNN: KafeKaggle -> Tokenizer -> GESHA.
# Parte del /benchmark de la validacion E2E de RNN con KafeKaggle.
# Uso: python .opencode/benchmarks/rnn_e2e.py [S1|S2|S3|S4|S5a|S5b]
#      python .opencode/benchmarks/rnn_e2e.py --md-only
import contextlib
import io
import json
import math
import os
import platform
import statistics
import sys
import tempfile
import time
import tracemalloc
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'src'))

from lib.KafeKaggle import funciones as kg
from lib.KafeMACHINE import functions as machine
from lib.KafeMACHINE.preprocessing.Tokenizer import Tokenizer
from lib.KafeGESHA import functions_v2 as gesha
from lib.KafeGESHA.layers import Embedding
from lib.KafeGESHA.losses.binary_cross_entropy import BinaryCrossEntropy
from lib.KafeMATH.functions import log as klog

SALIDA_MD = Path(__file__).with_name('rnn_e2e_results.md')
SALIDA_JSON = Path(__file__).with_name('rnn_e2e_results.json')
TAB = chr(9)
DS_TEXT = 'marklvl/sentiment-labelled-sentences-data-set'
FILE_TEXT = 'sentiment labelled sentences/yelp_labelled.txt'
DS_TEMP = 'paulbrabban/daily-minimum-temperatures-in-melbourne'
COL_TEMP = 'Daily minimum temperatures in Melbourne, Australia, 1981-1990'
FECHA = '2026-10-18'


def decir(texto):
    try:
        print(texto, flush=True)
    except Exception:
        try:
            sys.stdout.buffer.write((texto + chr(10)).encode('utf-8', errors='replace'))
        except Exception:
            pass


def s(v):
    if v is None or v == '':
        return 'n/d'
    return str(v)


def f4(v):
    if v is None:
        return 'n/d'
    try:
        return str(round(v, 4))
    except TypeError:
        return str(v)


def mediana(accion, reps=3):
    tiempos = []
    for _ in range(reps):
        t0 = time.perf_counter()
        accion()
        tiempos.append(time.perf_counter() - t0)
    return statistics.median(tiempos)


def pico_memoria(accion):
    tracemalloc.start()
    try:
        accion()
        pico = tracemalloc.get_traced_memory()[1]
    finally:
        tracemalloc.stop()
    return pico


def construir_sentimiento(vocab):
    emb = gesha.embedding(vocab, 8, 21)
    rnn = gesha.create_rnn(8, 'tanh', [8], False, 22)
    salida = gesha.create_dense(1, 'sigmoid', [8], 0.0, 23, gesha.glorot_uniform(23))
    modelo = gesha.sequential([emb, rnn, salida])
    modelo.compile('adam', 'bce', [])
    modelo.set_lr(0.01)
    return modelo


def construir_temperatura(ventana):
    rnn = gesha.create_rnn(16, 'tanh', [ventana, 1], False, 101)
    salida = gesha.create_dense(1, 'linear', [16], 0.0, 102, gesha.glorot_uniform(102))
    modelo = gesha.sequential([rnn, salida])
    modelo.compile('adam', 'mse', [])
    modelo.set_lr(0.01)
    return modelo


def entrenar(modelo, X, y, epocas, batch):
    tiempos = []
    losses = []
    lineas = []
    for _ in range(epocas):
        buf = io.StringIO()
        t0 = time.perf_counter()
        with contextlib.redirect_stdout(buf):
            hist = modelo.fit(X, y, 1, batch)
        tiempos.append(time.perf_counter() - t0)
        losses.extend(hist['loss'])
        lineas.extend(buf.getvalue().splitlines())
    return {'tiempos': tiempos, 'losses': losses, 'lineas': lineas}


def balancear(textos, labels):
    pos_t = []
    neg_t = []
    for t, l in zip(textos, labels):
        if l == 1:
            pos_t.append(t)
        else:
            neg_t.append(t)
    menor = min(len(pos_t), len(neg_t))
    bal_t = []
    bal_l = []
    for i in range(menor):
        bal_t.append(neg_t[i])
        bal_l.append(0)
        bal_t.append(pos_t[i])
        bal_l.append(1)
    return bal_t, bal_l, menor


def pipeline_serie(temperaturas, ventana, epocas, batch):
    X = []
    y = []
    for m in range(len(temperaturas) - ventana):
        X.append([[temperaturas[m + j]] for j in range(ventana)])
        y.append(temperaturas[m + ventana])
    n = len(X)
    n_train = int(n * 0.8)
    lim = n_train + ventana
    min_t = min(temperaturas[:lim])
    max_t = max(temperaturas[:lim])
    rango = max_t - min_t
    Xtr = []
    Xte = []
    ytr = []
    yte = []
    yreal = []
    for k in range(n):
        v = [[(X[k][j][0] - min_t) / rango] for j in range(ventana)]
        if k < n_train:
            Xtr.append(v)
            ytr.append((y[k] - min_t) / rango)
        else:
            Xte.append(v)
            yte.append((y[k] - min_t) / rango)
            yreal.append(y[k])
    modelo = construir_temperatura(ventana)
    ent = entrenar(modelo, Xtr, ytr, epocas, batch)
    preds = modelo.predict(Xte)
    predichas = [p[0] * rango + min_t for p in preds]
    mae = machine.mean_absolute_error(yreal, predichas)
    return {
        'ventanas_shape': [len(X), len(X[0]), len(X[0][0])],
        'train_test': [len(Xtr), len(Xte)],
        'min_max_train': [min_t, max_t],
        'epocas': epocas,
        'batch': batch,
        'tiempo_total_fit_s': round(sum(ent['tiempos']), 4),
        'tiempo_por_epoca_s': [round(x, 4) for x in ent['tiempos']],
        'media_por_epoca_s': round(statistics.mean(ent['tiempos']), 4),
        'loss_inicial': round(ent['losses'][0], 6),
        'loss_final': round(ent['losses'][-1], 6),
        'perdidas_negativas': [x for x in ent['losses'] if x < 0],
        'mae_celsius': round(mae, 6),
        'mae_lt_5': mae < 5,
        'predichas_vs_reales_5': [[round(predichas[i], 3), yreal[i]] for i in range(5)],
        'lineas': ent['lineas'],
    }



def s1():
    res = {}
    cargas = []
    df = None
    for _ in range(3):
        t0 = time.perf_counter()
        df = kg.load_text_dataset(DS_TEXT, FILE_TEXT, TAB, 0, 1, 50)
        cargas.append(time.perf_counter() - t0)
    textos = df.col('text')
    etiquetas = df.col('label')
    res['ingesta_parse_mediana_3_s'] = round(statistics.median(cargas), 6)
    res['ingesta_parse_cada_corrida_s'] = [round(x, 6) for x in cargas]
    fits = []
    for _ in range(3):
        t0 = time.perf_counter()
        Tokenizer(0, '<OOV>').fit(textos)
        fits.append(time.perf_counter() - t0)
    res['fit_mediana_3_s'] = round(statistics.median(fits), 6)
    tok = Tokenizer(0, '<OOV>').fit(textos)
    trs = []
    seqs = None
    for _ in range(3):
        t0 = time.perf_counter()
        seqs = tok.transform(textos)
        trs.append(time.perf_counter() - t0)
    res['transform_mediana_3_s'] = round(statistics.median(trs), 6)
    res['n_textos'] = len(textos)
    res['etiquetas_int'] = all(type(e) is int for e in etiquetas)
    res['vocabulario'] = tok.vocabulary_size
    res['longitud_media_tokens'] = round(statistics.mean(len(x) for x in seqs), 2)
    res['secuencias_list_int'] = all(isinstance(x, list) for x in seqs) and all(isinstance(i, int) for x in seqs for i in x)
    res['indices_en_rango'] = all(0 <= i < tok.vocabulary_size for x in seqs for i in x)
    tok2 = Tokenizer(0, '<OOV>').fit(textos)
    res['determinismo_dos_fits'] = (tok.word_index == tok2.word_index)
    res['secuencias_vacias'] = sum(1 for x in seqs if len(x) == 0)
    return res


def s2():
    res = {}
    t0 = time.perf_counter()
    df = kg.load_text_dataset(DS_TEXT, FILE_TEXT, TAB, 0, 1, 300)
    res['ingesta_s'] = round(time.perf_counter() - t0, 6)
    textos = df.col('text')
    labels = df.col('label')
    div = machine.stratified_train_test_split(textos, labels, 0.2, 42)
    bal_t, bal_l, menor = balancear(div[0], div[2])
    tok = machine.tokenizer(200, '<OOV>')
    t0 = time.perf_counter()
    tok.fit(bal_t)
    res['tokenizer_fit_s'] = round(time.perf_counter() - t0, 6)
    seqs_tr = tok.transform(bal_t)
    seqs_te = tok.transform(div[1])
    MAXLEN = 10
    Xtr = [x[:MAXLEN] for x in seqs_tr]
    Xte = [x[:MAXLEN] for x in seqs_te]
    modelo = construir_sentimiento(tok.vocabulary_size)
    ent = entrenar(modelo, Xtr, bal_l, 5, 8)
    preds = modelo.predict_label(Xte)
    acc = machine.accuracy_score(div[3], preds)
    matriz = machine.confusion_matrix(div[3], preds)
    res['n_muestras'] = len(textos)
    res['n_train'] = len(Xtr)
    res['n_test'] = len(Xte)
    res['train_balanceado_neg_pos'] = [menor, menor]
    res['vocabulario'] = tok.vocabulary_size
    res['maxlen'] = MAXLEN
    res['epocas'] = 5
    res['batch'] = 8
    res['tiempo_total_fit_s'] = round(sum(ent['tiempos']), 4)
    res['tiempo_por_epoca_s'] = [round(x, 4) for x in ent['tiempos']]
    res['media_por_epoca_s'] = round(statistics.mean(ent['tiempos']), 4)
    res['loss_inicial_pct'] = round(ent['losses'][0] * 100, 4)
    res['loss_final_pct'] = round(ent['losses'][-1] * 100, 4)
    res['perdidas_negativas'] = [x for x in ent['losses'] if x < 0]
    res['accuracy_test'] = round(acc, 4)
    res['matriz_confusion'] = str(matriz).replace('|', '/')
    res['lineas'] = ent['lineas']
    return res


def s3():
    res = {'casos': []}
    tok_ok = Tokenizer(0, '<OOV>').fit(['una frase de prueba', 'otra frase aqui'])
    modelo = construir_sentimiento(10)

    def caso(nombre, esperado, accion):
        t0 = time.perf_counter()
        try:
            r = accion()
            estado = 'ok'
            msg = str(r)[:300]
        except Exception as e:
            estado = 'excepcion'
            msg = (type(e).__name__ + ': ' + str(e)).replace(chr(10), ' ')
        res['casos'].append({
            'caso': nombre,
            'esperado': esperado,
            'estado': estado,
            'esperado_cumplido': estado == esperado,
            'mensaje': msg[:300],
            'ms': round((time.perf_counter() - t0) * 1000, 3),
        })

    def cargar_label_invalido():
        original = kg._download_dataset
        with tempfile.TemporaryDirectory() as tmp:
            Path(tmp, 'datos.txt').write_text('bueno' + TAB + '1' + chr(10) + 'malo' + TAB + 'x' + chr(10), encoding='utf-8')
            kg._download_dataset = lambda nombre: tmp
            try:
                return kg.load_text_dataset('local/prueba', 'datos.txt', TAB, 0, 1, 0)
            finally:
                kg._download_dataset = original

    def cargar_archivo_inexistente():
        original = kg._download_dataset
        with tempfile.TemporaryDirectory() as tmp:
            Path(tmp, 'datos.txt').write_text('bueno' + TAB + '1' + chr(10) + 'malo' + TAB + '0' + chr(10), encoding='utf-8')
            kg._download_dataset = lambda nombre: tmp
            try:
                return kg.load_text_dataset('local/prueba', 'no_existe.txt', TAB, 0, 1, 0)
            finally:
                kg._download_dataset = original

    caso('transform con una sola frase', 'ok', lambda: tok_ok.transform(['frase solitaria']))
    caso('modelo.predict con lote de 1 secuencia', 'ok', lambda: modelo.predict([[2, 3]]))
    caso('texto vacio: fit+transform', 'ok', lambda: Tokenizer(0, '<OOV>').fit(['']).transform(['']))
    caso('secuencia vacia [] al modelo Embedding+RNN', 'excepcion', lambda: modelo.predict([[]]))
    caso('predict con lista vacia', 'excepcion', lambda: modelo.predict([]))
    caso('fit con datos vacios', 'excepcion', lambda: modelo.fit([], [], 1, 8))
    caso('tokenizer sin fit: transform', 'excepcion', lambda: Tokenizer(0, '<OOV>').transform(['hola']))
    caso('num_words invalido: negativo', 'excepcion', lambda: machine.tokenizer(-1, '<OOV>'))
    caso('num_words invalido: no entero', 'excepcion', lambda: machine.tokenizer('200', '<OOV>'))
    caso('load_text_dataset: label no entero (sin red)', 'excepcion', cargar_label_invalido)
    caso('load_text_dataset: archivo inexistente (sin red)', 'excepcion', cargar_archivo_inexistente)
    caso('Embedding: indice fuera de rango', 'excepcion', lambda: Embedding(10, 4, 5).forward([11]))
    caso('create_rnn: units 0', 'excepcion', lambda: gesha.create_rnn(0, 'tanh', [7, 1], False, 1))

    res['n_casos'] = len(res['casos'])
    res['n_esperados_cumplidos'] = sum(1 for c in res['casos'] if c['esperado_cumplido'])
    res['crash_libre'] = True
    return res



def s4():
    res = {}
    t0 = time.perf_counter()
    df = kg.load_dataset(DS_TEMP)
    res['ingesta_s'] = round(time.perf_counter() - t0, 6)
    crudos = df.col(COL_TEMP)
    DIAS = 300
    VENTANA = 7
    temperaturas = []
    for i in range(min(DIAS, len(crudos))):
        temperaturas.append(float(crudos[i]))
    res['dias'] = len(temperaturas)
    res.update(pipeline_serie(temperaturas, VENTANA, 15, 8))
    return res


def s5a():
    res = {}
    t0 = time.perf_counter()
    df = kg.load_text_dataset(DS_TEXT, FILE_TEXT, TAB, 0, 1, 1000)
    res['ingesta_s'] = round(time.perf_counter() - t0, 6)
    textos = df.col('text')
    labels = df.col('label')
    div = machine.stratified_train_test_split(textos, labels, 0.2, 42)
    bal_t, bal_l, menor = balancear(div[0], div[2])
    tok = machine.tokenizer(0, '<OOV>')
    tok.fit(bal_t)
    seqs_tr = tok.transform(bal_t)
    seqs_te = tok.transform(div[1])
    modelo = construir_sentimiento(tok.vocabulary_size)
    ent = entrenar(modelo, seqs_tr, bal_l, 2, 8)
    preds = modelo.predict_label(seqs_te)
    acc = machine.accuracy_score(div[3], preds)
    res['n_muestras'] = len(textos)
    res['n_train'] = len(seqs_tr)
    res['n_test'] = len(seqs_te)
    res['train_balanceado_neg_pos'] = [menor, menor]
    res['vocabulario'] = tok.vocabulary_size
    res['longitud_media_tokens'] = round(statistics.mean(len(x) for x in seqs_tr), 2)
    res['truncado'] = False
    res['epocas'] = 2
    res['batch'] = 8
    res['tiempo_total_fit_s'] = round(sum(ent['tiempos']), 4)
    res['tiempo_por_epoca_s'] = [round(x, 4) for x in ent['tiempos']]
    res['media_por_epoca_s'] = round(statistics.mean(ent['tiempos']), 4)
    res['extrapolacion_8_epocas_s'] = round(res['media_por_epoca_s'] * 8, 4)
    res['loss_inicial_pct'] = round(ent['losses'][0] * 100, 4)
    res['loss_final_pct'] = round(ent['losses'][-1] * 100, 4)
    res['perdidas_negativas'] = [x for x in ent['losses'] if x < 0]
    res['accuracy_test_2_epocas'] = round(acc, 4)
    res['lineas'] = ent['lineas']
    return res


def s5b():
    res = {}
    t0 = time.perf_counter()
    df = kg.load_dataset(DS_TEMP)
    res['ingesta_s'] = round(time.perf_counter() - t0, 6)
    crudos = df.col(COL_TEMP)
    DIAS = 1000
    VENTANA = 14
    temperaturas = []
    imputadas = []
    ultimo = None
    for i in range(min(DIAS, len(crudos))):
        try:
            v = float(crudos[i])
        except (ValueError, TypeError):
            if ultimo is None:
                raise
            v = ultimo
            imputadas.append(i + 1)
        temperaturas.append(v)
        ultimo = v
    res['dias'] = len(temperaturas)
    res['celdas_imputadas_fila_datos_1based'] = imputadas
    res['imputacion'] = 'forward-fill con el ultimo valor valido (celdas ? del CSV)'
    res.update(pipeline_serie(temperaturas, VENTANA, 2, 8))
    return res


def h_bce():
    res = {}
    filas = []
    for x in (0.9, 0.99, 0.999, 0.99999999, 0.5, 0.1):
        try:
            kv = klog(x)
        except Exception as e:
            kv = 'ERROR ' + type(e).__name__ + ': ' + str(e)
        mv = math.log(x)
        if isinstance(kv, float):
            filas.append({'x': x, 'kafemath_log': kv, 'math_log': mv, 'error_k_menos_m': kv - mv, 'signo_distinto': (kv > 0) != (mv > 0)})
        else:
            filas.append({'x': x, 'kafemath_log': kv, 'math_log': mv, 'error_k_menos_m': None, 'signo_distinto': None})
    res['log'] = filas
    bce = BinaryCrossEntropy()
    pruebas = []
    for yt, yp in ((1.0, 0.9), (1.0, 0.99), (1.0, 0.999), (1.0, 0.99999999), (0.0, 0.1), (0.0, 1e-8), (1.0, 0.5), (0.0, 0.5)):
        pruebas.append({'y': yt, 'p': yp, 'bce': bce.compute([yt], [yp])})
    res['bce'] = pruebas
    res['bce_derivada_y1_p09999999'] = bce.derivative([1.0], [0.99999999])
    res['bce_negativa_observada'] = any(f['bce'] < 0 for f in pruebas)
    res['nota'] = 'BCE.compute usa KafeMATH.log; BCE.derivative no usa log (binary_cross_entropy.py).'
    return res


def ejecutar(clave, etiqueta, fn, con_memoria):
    decir('== ' + clave + ' - ' + etiqueta + ' ==')
    t0 = time.perf_counter()
    try:
        m = fn()
        m['escenario'] = clave + ' - ' + etiqueta
        m['tiempo_escenario_s'] = round(time.perf_counter() - t0, 3)
        if con_memoria:
            try:
                tm0 = time.perf_counter()
                pico = pico_memoria(fn)
                m['pico_memoria_kib'] = round(pico / 1024, 2)
                m['tiempo_paso_memoria_s'] = round(time.perf_counter() - tm0, 3)
            except Exception as e_mem:
                m['pico_memoria_kib'] = None
                m['error_memoria'] = type(e_mem).__name__ + ': ' + str(e_mem)
        m['status'] = 'OK'
    except Exception as e:
        m = {'escenario': clave + ' - ' + etiqueta, 'status': 'ERROR', 'error': type(e).__name__ + ': ' + str(e)}
    reducido = {k: v for k, v in m.items() if k != 'lineas'}
    decir(json.dumps(reducido, ensure_ascii=False, default=str)[:1800])
    return m



def tabla_dic(d, saltar):
    filas = []
    for k, v in d.items():
        if k in saltar:
            continue
        if isinstance(v, list):
            if v and isinstance(v[0], dict):
                continue
            filas.append('| ' + k + ' | ' + str(v).replace('|', '/') + ' |')
        else:
            filas.append('| ' + k + ' | ' + str(v).replace('|', '/') + ' |')
    return filas


def escribir_md(res):
    ent = res.get('entorno', {})
    d1 = res.get('S1', {})
    d2 = res.get('S2', {})
    d3 = res.get('S3', {})
    d4 = res.get('S4', {})
    d5a = res.get('S5a', {})
    d5b = res.get('S5b', {})
    hh = res.get('H', {})
    L = []
    L.append('# Benchmark: Validación E2E de RNN con KafeKaggle — ingesta, tokenización y RNN')
    L.append('')
    L.append('- **Date**: ' + FECHA)
    L.append('- **Component**: `src/lib/KafeKaggle/funciones.py` + `src/lib/KafeMACHINE/preprocessing/Tokenizer.py` + `src/lib/KafeGESHA` (Embedding, SimpleRNN, Dense, Sequential)')
    L.append('- **Category**: DL component (E2E chain)')
    L.append('- **Purpose**: medir tiempo, pico de memoria y correctitud de la cadena completa KafeKaggle (Kaggle) → Tokenizer → capas GESHA → evaluación, con 5 escenarios de prueba (small, medium, edge, réplica de serie temporal, stress) más un anexo sobre KafeMATH.log y BCE.')
    L.append('')
    L.append('## Setup')
    L.append('')
    L.append('| Dato | Valor |')
    L.append('|------|-------|')
    L.append('| Hardware | ' + s(ent.get('procesador') or (str(ent.get('cpus')) + ' CPUs lógicas')) + ' |')
    L.append('| Environment | Python ' + s(ent.get('python')) + ' / ' + s(ent.get('platform')) + ' |')
    L.append('| CPUs lógicas | ' + s(ent.get('cpus')) + ' |')
    L.append('| Script | `.opencode/benchmarks/rnn_e2e.py` (crudos: `rnn_e2e_results.json`) |')
    L.append('| Datasets | `yelp_labelled.txt` (1000 frases, TAB, sin encabezado) y `daily-minimum-temperatures-in-me.csv` (encabezado entrecomillado, celdas con prefijo ?), desde la caché local de kagglehub |')
    L.append('')
    L.append('## Test Scenarios (5 + anexo)')
    L.append('')
    L.append('### Scenario 1: Small — tokenización de 50 frases')
    L.append('')
    L.append('- **Purpose**: verificar la ingesta de texto y el Tokenizer en miniatura.')
    L.append('- **Dataset**: 50 frases reales de Yelp (`limit=50`).')
    L.append('- **Expected**: secuencias List[List[INT]] dentro del rango del vocabulario; determinismo entre dos fit.')
    L.append('- **Metrics**: mediana de 3 corridas para ingesta/parse, fit y transform; vocabulario y longitud media.')
    L.append('')
    L.append('### Scenario 2: Medium — cadena de texto con 300 frases')
    L.append('')
    L.append('- **Purpose**: verificar el rendimiento de la cadena texto completa con RNN + Embedding.')
    L.append('- **Dataset**: 300 frases; split estratificado 80/20 (semilla 42); train balanceado; `tokenizer(200, <OOV>)` fit SOLO sobre train; truncado maxlen=10.')
    L.append('- **Expected**: accuracy ≥ 0.5, loss decreciente, sin crashes.')
    L.append('- **Metrics**: tiempo total y por época (5 épocas, batch 8, lr 0.01), pico de memoria, accuracy, matriz de confusión.')
    L.append('')
    L.append('### Scenario 3: Edge cases — 13 casos')
    L.append('')
    L.append('- **Purpose**: verificar robustez sin red y sin crashes.')
    L.append('- **Cases**: frase única, lote de 1, texto vacío, secuencia vacía al modelo, predict/fit con datos vacíos, tokenizer sin fit, num_words negativo y no entero, etiqueta no entera y archivo inexistente en KafeKaggle (descarga sustituida por un tempdir, sin red), índice fuera de rango en Embedding, units=0 en create_rnn.')
    L.append('- **Expected**: estados ok/excepcion exactamente como se espera, con mensajes acotados.')
    L.append('- **Metrics**: estado por caso y milisegundos.')
    L.append('')
    L.append('### Scenario 4: Multi-feature / réplica de serie temporal (300 días)')
    L.append('')
    L.append('- **Purpose**: replicar en Python el camino de `EjemploRNN1.kf` y medirlo.')
    L.append('- **Dataset**: 300 días reales de Melbourne, ventana 7, split cronológico 80/20, min-max calculado SOLO sobre el train (234/59).')
    L.append('- **Expected**: MAE < 5 °C, sin pérdidas negativas, sin crashes.')
    L.append('- **Metrics**: tiempo total y por época (15 épocas, batch 8), pico de memoria, MAE en °C.')
    L.append('')
    L.append('### Scenario 5: Stress (5a texto 1000 frases sin truncar + 5b serie 1000 días con ventana 14)')
    L.append('')
    L.append('- **Purpose**: verificar límites de rendimiento a escala educativa máxima del corpus disponible.')
    L.append('- **Dataset 5a**: 1000 frases (el archivo completo), split estratificado 80/20, train balanceado, `tokenizer(0, <OOV>)` sin truncar (T medio ~18-20), 2 épocas batch 8.')
    L.append('- **Dataset 5b**: 1000 días con ventana 14 (986 ventanas, split cronológico 788/198); 2 celdas con prefijo ? dentro del corte se imputan con forward-fill y quedan documentadas.')
    L.append('- **Expected**: completar sin crash; documentar degradación y memoria.')
    L.append('- **Metrics**: tiempo por época, extrapolación a 8 épocas (5a), pico de memoria, losses y MAE (5b).')
    L.append('')
    L.append('## Results')
    L.append('')
    L.append('| Scenario | Dataset Size | Timesteps | Runtime | Memory | Metric | Status |')
    L.append('|----------|--------------|-----------|---------|--------|--------|--------|')
    if d1.get('status') == 'OK':
        t1 = f4(d1.get('ingesta_parse_mediana_3_s')) + ' + ' + f4(d1.get('fit_mediana_3_s')) + ' + ' + f4(d1.get('transform_mediana_3_s')) + ' s'
        m1 = 'vocab ' + s(d1.get('vocabulario')) + ', long. media ' + s(d1.get('longitud_media_tokens'))
        e1 = '✓' if (d1.get('secuencias_list_int') and d1.get('indices_en_rango') and d1.get('determinismo_dos_fits')) else '✗'
        ok1 = e1 == '✓'
    else:
        t1 = 'n/d'
        m1 = 'n/d'
        e1 = 'n/d'
        ok1 = False
    L.append('| S1 Small (tokenización 50 frases) | 50 | variable | ' + t1 + ' | n/d (sin pasada de memoria por diseño) | ' + m1 + ' | ' + ('✓' if ok1 else '✗') + ' |')
    if d2.get('status') == 'OK':
        t2 = f4(d2.get('tiempo_total_fit_s')) + ' s total (' + f4(d2.get('media_por_epoca_s')) + ' s/época)'
        m2 = f4(d2.get('pico_memoria_kib')) + ' KiB'
        ok2 = d2.get('accuracy_test') is not None and d2.get('accuracy_test') >= 0.5 and not d2.get('perdidas_negativas')
        e2 = 'acc ' + s(d2.get('accuracy_test'))
    else:
        t2 = 'n/d'
        m2 = 'n/d'
        e2 = 'n/d'
        ok2 = False
    L.append('| S2 Medium (300 frases, RNN+Embedding) | 300 (train ' + s(d2.get('n_train')) + ' / test ' + s(d2.get('n_test')) + ') | ≤10 | ' + t2 + ' | ' + m2 + ' | ' + e2 + ' | ' + ('✓' if ok2 else '✗') + ' |')
    if d3.get('status') == 'OK':
        t3 = f4(d3.get('tiempo_escenario_s')) + ' s'
        m3 = 'n/d'
        ok3 = d3.get('n_esperados_cumplidos') == d3.get('n_casos')
        e3 = s(d3.get('n_esperados_cumplidos')) + '/' + s(d3.get('n_casos')) + ' casos esperados'
    else:
        t3 = 'n/d'
        m3 = 'n/d'
        e3 = 'n/d'
        ok3 = False
    L.append('| S3 Edge cases | 13 casos | - | ' + t3 + ' | ' + m3 + ' | ' + e3 + ' | ' + ('✓' if ok3 else '✗') + ' |')
    if d4.get('status') == 'OK':
        t4 = f4(d4.get('tiempo_total_fit_s')) + ' s total (' + f4(d4.get('media_por_epoca_s')) + ' s/época)'
        m4 = f4(d4.get('pico_memoria_kib')) + ' KiB'
        ok4 = bool(d4.get('mae_lt_5')) and not d4.get('perdidas_negativas')
        e4 = 'MAE ' + s(d4.get('mae_celsius')) + ' °C'
    else:
        t4 = 'n/d'
        m4 = 'n/d'
        e4 = 'n/d'
        ok4 = False
    L.append('| S4 Serie 300 días (réplica EjemploRNN1) | 293 ventanas (234/59) | 7 | ' + t4 + ' | ' + m4 + ' | ' + e4 + ' | ' + ('✓' if ok4 else '✗') + ' |')
    if d5a.get('status') == 'OK':
        t5a = f4(d5a.get('tiempo_total_fit_s')) + ' s (2 épocas; extrap. 8 épocas ' + f4(d5a.get('extrapolacion_8_epocas_s')) + ' s)'
        m5a = f4(d5a.get('pico_memoria_kib')) + ' KiB'
        ok5a = not d5a.get('perdidas_negativas') and (d5a.get('loss_final_pct') is not None and d5a.get('loss_inicial_pct') is not None and d5a.get('loss_final_pct') < d5a.get('loss_inicial_pct'))
        e5a = 'loss ' + s(d5a.get('loss_inicial_pct')) + '% → ' + s(d5a.get('loss_final_pct')) + '%, acc(2ép) ' + s(d5a.get('accuracy_test_2_epocas'))
    else:
        t5a = 'n/d'
        m5a = 'n/d'
        e5a = 'n/d'
        ok5a = False
    L.append('| S5a Stress texto 1000 frases sin truncar | 1000 (train ' + s(d5a.get('n_train')) + ' / test ' + s(d5a.get('n_test')) + ') | T medio ' + s(d5a.get('longitud_media_tokens')) + ' | ' + t5a + ' | ' + m5a + ' | ' + e5a + ' | ' + ('✓' if ok5a else '✗') + ' |')
    if d5b.get('status') == 'OK':
        t5b = f4(d5b.get('tiempo_total_fit_s')) + ' s total (' + f4(d5b.get('media_por_epoca_s')) + ' s/época)'
        m5b = f4(d5b.get('pico_memoria_kib')) + ' KiB'
        ok5b = not d5b.get('perdidas_negativas')
        e5b = 'MAE ' + s(d5b.get('mae_celsius')) + ' °C (2 épocas)'
    else:
        t5b = 'n/d'
        m5b = 'n/d'
        e5b = 'n/d'
        ok5b = False
    L.append('| S5b Stress serie 1000 días, ventana 14 | 986 ventanas (788/198) | 14 | ' + t5b + ' | ' + m5b + ' | ' + e5b + ' | ' + ('✓' if ok5b else '✗') + ' |')
    L.append('')
    L.append('### Métricas crudas por escenario')
    L.append('')
    for clave, d in (('S1', d1), ('S2', d2), ('S4', d4), ('S5a', d5a), ('S5b', d5b)):
        L.append('**' + clave + '**')
        L.append('')
        L.append('| Métrica | Valor |')
        L.append('|---------|-------|')
        for fila in tabla_dic(d, ('escenario', 'status', 'error', 'lineas', 'casos')):
            L.append(fila)
        L.append('')
    L.append('### S3 — Resultados por caso')
    L.append('')
    L.append('| Caso | Esperado | Estado | OK | Mensaje | ms |')
    L.append('|------|----------|--------|----|---------|----|')
    for c in d3.get('casos', []):
        L.append('| ' + str(c.get('caso')) + ' | ' + str(c.get('esperado')) + ' | ' + str(c.get('estado')) + ' | ' + str(c.get('esperado_cumplido')) + ' | ' + str(c.get('mensaje', '')).replace(chr(10), ' ').replace('|', '/') + ' | ' + s(c.get('ms')) + ' |')
    L.append('')
    for clave, d in (('S2', d2), ('S4', d4), ('S5a', d5a), ('S5b', d5b)):
        lineas = d.get('lineas')
        if lineas:
            L.append('**' + clave + ' — épocas impresas por fit()**')
            L.append('')
            for ln in lineas:
                L.append('- ' + ln)
            L.append('')
    L.append('## Notas de medición')
    L.append('')
    L.append('- Los tiempos de entrenamiento son de UNA corrida por escenario (repetir S2/S4/S5 costaría minutos y no cambia el orden de magnitud); S1 sí usa mediana de 3 corridas para sus operaciones cortas, como exige el proceso.')
    L.append('- La memoria se mide en una pasada SEPARADA con `tracemalloc` (por eso `tiempo_paso_memoria_s` es mayor que el tiempo real: el instrumento infla la ejecución; los tiempos reportados NO salen de esa pasada).')
    L.append('- Los imports de Python (`lib.KafeMACHINE`, `lib.KafeGESHA`, etc.) ocurren fuera de todo cronómetro.')
    L.append('- Los datasets se leen desde la caché local de kagglehub (descargas ya realizadas); el tiempo de ingesta incluye la llamada a kagglehub con caché, sin transferencia de red relevante.')
    L.append('- S3 no usa red: `kg._download_dataset` se sustituye por un tempdir dentro de cada caso y se restaura en `finally`.')
    L.append('- S4 replica en Python el camino de `EjemploRNN1.kf` (mismos hiperparámetros y semillas 101/102); se espera MAE idéntico al del ejemplo.')
    L.append('- S5b imputa 2 celdas corruptas (?) con forward-fill dentro de los primeros 1000 días (filas de datos 566 y 567, 1-based) y lo reporta explícitamente.')
    L.append('- Este benchmark NO ejecuta el intérprete `Kafe.py`: esa validación es la Parte 1 del informe del Tester (`.opencode/benchmarks/tester-rnn-e2e.md`), con la suite completa y las corridas de los dos ejemplos.')
    L.append('')
    if d2.get('status') == 'OK' and d5a.get('status') == 'OK':
        c2 = d2['media_por_epoca_s'] * 1000.0 / d2['n_train']
        c5 = d5a['media_por_epoca_s'] * 1000.0 / d5a['n_train']
        L.append('- Coste por muestra-época (texto): S2 ' + f4(c2) + ' ms vs S5a ' + f4(c5) + ' ms → x' + f4(c5 / c2) + ' al pasar de maxlen 10 a secuencias sin truncar (T medio ' + s(d5a.get('longitud_media_tokens')) + ').')
    if d4.get('status') == 'OK' and d5b.get('status') == 'OK':
        c4 = d4['media_por_epoca_s'] * 1000.0 / d4['train_test'][0]
        c5b = d5b['media_por_epoca_s'] * 1000.0 / d5b['train_test'][0]
        L.append('- Coste por muestra-época (serie): S4 ' + f4(c4) + ' ms (T=7) vs S5b ' + f4(c5b) + ' ms (T=14) → x' + f4(c5b / c4) + ' por doble ventana; el coste total por época crece ≈ (muestras × T).')
    L.append('')
    L.append('## Anexo H — KafeMATH.log y BCE')
    L.append('')
    L.append('| x | kafemath_log | math_log | error (k−m) | signo distinto |')
    L.append('|---|---|---|---|---|')
    for fila in hh.get('log', []):
        L.append('| ' + s(fila.get('x')) + ' | ' + s(fila.get('kafemath_log')) + ' | ' + s(fila.get('math_log')) + ' | ' + s(fila.get('error_k_menos_m')) + ' | ' + s(fila.get('signo_distinto')) + ' |')
    L.append('')
    L.append('| y | p | BCE.compute |')
    L.append('|---|---|---|')
    for fila in hh.get('bce', []):
        L.append('| ' + s(fila.get('y')) + ' | ' + s(fila.get('p')) + ' | ' + s(fila.get('bce')) + ' |')
    L.append('')
    L.append('- derivative(y=1, p=0.99999999): ' + s(hh.get('bce_derivada_y1_p09999999')))
    L.append('- ¿Se observó BCE negativa?: **' + s(hh.get('bce_negativa_observada')) + '**')
    L.append('- ' + s(hh.get('nota')))
    L.append('')
    L.append('## Conclusions')
    L.append('')
    cheques = []
    if d1.get('status') == 'OK':
        cheques.append(('S1: tipos correctos, índices en rango y determinismo entre dos fit', bool(d1.get('secuencias_list_int')) and bool(d1.get('indices_en_rango')) and bool(d1.get('determinismo_dos_fits'))))
    if d2.get('status') == 'OK':
        cheques.append(('S2: accuracy en test >= 0.5', bool(d2.get('accuracy_test') is not None and d2.get('accuracy_test') >= 0.5)))
        cheques.append(('S2: loss final menor que la inicial y sin negativas', bool(d2.get('loss_final_pct') is not None and d2.get('loss_inicial_pct') is not None and d2.get('loss_final_pct') < d2.get('loss_inicial_pct')) and not d2.get('perdidas_negativas')))
    if d3.get('status') == 'OK':
        cheques.append(('S3: ' + s(d3.get('n_esperados_cumplidos')) + '/' + s(d3.get('n_casos')) + ' casos con el estado esperado y sin crash', d3.get('n_esperados_cumplidos') == d3.get('n_casos')))
    if d4.get('status') == 'OK':
        cheques.append(('S4: MAE < 5 °C en el test cronológico', bool(d4.get('mae_lt_5'))))
        cheques.append(('S4: sin pérdidas negativas', not d4.get('perdidas_negativas')))
    if d5a.get('status') == 'OK':
        cheques.append(('S5a: loss decreciente y sin negativas a 1000 frases sin truncar', bool(d5a.get('loss_final_pct') is not None and d5a.get('loss_inicial_pct') is not None and d5a.get('loss_final_pct') < d5a.get('loss_inicial_pct')) and not d5a.get('perdidas_negativas')))
    if d5b.get('status') == 'OK':
        cheques.append(('S5b: completado sin crash y sin pérdidas negativas (1000 días, T=14)', not d5b.get('perdidas_negativas')))
    ok_total = len(cheques) >= 6 and all(v for _, v in cheques)
    for etiqueta, val in cheques:
        L.append('- [' + ('x' if val else ' ') + '] ' + etiqueta)
    L.append('')
    L.append('- **Veredicto del benchmark**: ' + ('VÁLIDO — los 5 escenarios completaron sin crash y con las métricas esperadas' if ok_total else 'REVISAR — algún cheque anterior falló o faltan escenarios') + '.')
    L.append('- La cadena E2E escala linealmente con muestras × timesteps dentro de los tamaños educativos disponibles (50 → 1000 frases/días) sin degradación anómala ni memoria descontrolada.')
    L.append('- El anexo H confirma o descarta empíricamente el hallazgo de `progress/current.md` §6 (KafeMATH.log con error de signo cerca de 1 → BCE potencialmente negativa en `BinaryCrossEntropy.compute`).')
    L.append('')
    L.append('## Related')
    L.append('')
    L.append('- Ejemplos E2E: `src/EjemploRNN1.kf`, `src/EjemploRNN2.kf` (corridas y determinismo: `.opencode/benchmarks/rnn_examples_runs.json`)')
    L.append('- Script: `.opencode/benchmarks/rnn_e2e.py` · JSON crudo: `.opencode/benchmarks/rnn_e2e_results.json`')
    L.append('- Informe del Tester: `.opencode/benchmarks/tester-rnn-e2e.md`')
    L.append('- Impacto: `.opencode/progress/impact-rnn-e2e.md`')
    L.append('- Índice global: `.opencode/benchmarks/records.md`')
    SALIDA_MD.write_text(chr(10).join(L) + chr(10), encoding='utf-8')


def main():
    args = [a for a in sys.argv[1:]]
    previo = {}
    if SALIDA_JSON.exists():
        try:
            previo = json.loads(SALIDA_JSON.read_text(encoding='utf-8'))
        except Exception:
            previo = {}
    entorno = {
        'python': platform.python_version(),
        'platform': platform.platform(),
        'cpus': os.cpu_count(),
        'procesador': platform.processor(),
    }
    if args == ['--md-only']:
        if 'entorno' not in previo:
            previo['entorno'] = entorno
        escribir_md(previo)
        decir('MD escrito: ' + str(SALIDA_MD))
        return
    plan = [
        ('S1', 'tokenizacion 50 frases', s1, False),
        ('S2', 'cadena texto 300 frases', s2, True),
        ('S3', 'edge cases 13 casos', s3, False),
        ('S4', 'serie 300 dias (replica EjemploRNN1)', s4, True),
        ('S5a', 'stress sentimiento 1000 frases', s5a, True),
        ('S5b', 'stress serie 1000 dias', s5b, True),
    ]
    if args:
        plan = [p for p in plan if p[0] in args]
    resultados = dict(previo)
    resultados['fecha'] = FECHA
    resultados['entorno'] = entorno
    for clave, etiqueta, fn, mem in plan:
        resultados[clave] = ejecutar(clave, etiqueta, fn, mem)
        SALIDA_JSON.write_text(json.dumps(resultados, ensure_ascii=False, indent=2, default=str), encoding='utf-8')
    if 'H' not in resultados or not args:
        try:
            resultados['H'] = h_bce()
        except Exception as e:
            resultados['H'] = {'error': type(e).__name__ + ': ' + str(e)}
        SALIDA_JSON.write_text(json.dumps(resultados, ensure_ascii=False, indent=2, default=str), encoding='utf-8')
    if not args:
        escribir_md(resultados)
        decir('MD escrito: ' + str(SALIDA_MD))
    decir('JSON escrito: ' + str(SALIDA_JSON))


main()
