import json
import re
import subprocess
import sys
import time
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
SRC = RAIZ / 'src'
KAFE = SRC / 'Kafe.py'
SALIDA = Path(__file__).with_name('rnn_examples_runs.json')


def dec(b):
    if b is None:
        return ''
    try:
        t = b.decode('utf-8')
    except UnicodeDecodeError:
        t = b.decode('cp1252', errors='replace')
    return t.replace('\r\n', '\n').replace('\r', '\n')


def correr(nombre, vez):
    inicio = time.perf_counter()
    try:
        r = subprocess.run([sys.executable, str(KAFE), nombre], cwd=str(SRC), input=b'', capture_output=True, timeout=900)
    except subprocess.TimeoutExpired as e:
        seg = time.perf_counter() - inicio
        return {'ejemplo': nombre, 'corrida': vez, 'rc': 'TIMEOUT', 'segundos': round(seg, 2), 'stdout': dec(e.stdout), 'stderr': dec(e.stderr)}
    seg = time.perf_counter() - inicio
    return {'ejemplo': nombre, 'corrida': vez, 'rc': r.returncode, 'segundos': round(seg, 2), 'stdout': dec(r.stdout), 'stderr': dec(r.stderr)}


patron_loss = re.compile(r'Epoch \d+/\d+ — Loss (-?[\d.]+)%')
patron_mae = re.compile(r'MAE en grados Celsius:\n(-?[\d.]+)')
patron_acc = re.compile(r'Accuracy en test:\n(-?[\d.]+)')
patron_matriz = re.compile(r'Matriz de confusión \[\[TN, FP\], \[FN, TP\]\]:\n(\[\[.*?\]\])')
patron_frases = re.compile(r'^(The food was .*?|Terrible experience.*?|It was okay.*?) -> ([01])$', re.M)


def verificaciones(corridas):
    v = {}
    for nombre in ('EjemploRNN1.kf', 'EjemploRNN2.kf'):
        c = [x for x in corridas if x['ejemplo'] == nombre]
        out = c[0]['stdout']
        err = c[0]['stderr']
        losses = [float(m) for m in patron_loss.findall(out)]
        pasos_dec = sum(1 for i in range(1, len(losses)) if losses[i] < losses[i - 1])
        v[nombre] = {
            'rc': c[0]['rc'],
            'sin_trazas': ('Traceback' not in out) and ('Traceback' not in err),
            'perdidas': losses,
            'n_perdidas': len(losses),
            'loss_inicial_pct': losses[0] if losses else None,
            'loss_final_pct': losses[-1] if losses else None,
            'decremento_global': (losses[-1] < losses[0]) if losses else False,
            'pasos_decrecientes': pasos_dec,
            'n_pasos': max(len(losses) - 1, 0),
            'perdidas_negativas': [x for x in losses if x < 0],
        }
    out1 = [x for x in corridas if x['ejemplo'] == 'EjemploRNN1.kf'][0]['stdout']
    m = patron_mae.search(out1)
    v['EjemploRNN1.kf']['mae_celsius'] = float(m.group(1)) if m else None
    v['EjemploRNN1.kf']['mae_lt_5'] = bool(m) and float(m.group(1)) < 5
    out2 = [x for x in corridas if x['ejemplo'] == 'EjemploRNN2.kf'][0]['stdout']
    m2 = patron_acc.search(out2)
    v['EjemploRNN2.kf']['accuracy_test'] = float(m2.group(1)) if m2 else None
    v['EjemploRNN2.kf']['accuracy_ge_05'] = bool(m2) and float(m2.group(1)) >= 0.5
    m3 = patron_matriz.search(out2)
    v['EjemploRNN2.kf']['matriz_confusion'] = m3.group(1) if m3 else None
    frases = [{'frase': f, 'prediccion': p} for f, p in patron_frases.findall(out2)]
    v['EjemploRNN2.kf']['frases_nuevas'] = frases
    v['EjemploRNN2.kf']['n_frases_nuevas'] = len(frases)
    return v


def main():
    corridas = []
    for nombre in ('EjemploRNN1.kf', 'EjemploRNN2.kf'):
        for vez in (1, 2):
            c = correr(nombre, vez)
            corridas.append(c)
            print(nombre, 'corrida', vez, '-> rc', c['rc'], 'en', c['segundos'], 's', flush=True)
    det = {}
    for nombre in ('EjemploRNN1.kf', 'EjemploRNN2.kf'):
        c = [x for x in corridas if x['ejemplo'] == nombre]
        det[nombre] = (c[0]['stdout'] == c[1]['stdout']) and (c[0]['stderr'] == c[1]['stderr']) and (c[0]['rc'] == c[1]['rc'])
    data = {'corridas': corridas, 'determinismo': det, 'verificaciones': verificaciones(corridas)}
    SALIDA.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    print('determinismo:', json.dumps(det, ensure_ascii=False))
    print('verificaciones:', json.dumps(data['verificaciones'], ensure_ascii=False))
    print('escrito:', SALIDA)


if __name__ == '__main__':
    main()
