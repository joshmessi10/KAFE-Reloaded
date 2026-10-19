# -*- coding: utf-8 -*-
"""Verificación de equivalencia bit-a-bit de conv2d_chw y conv2d_chw_backward.

Compara las funciones optimizadas de ``lib.KafeNUMK.funciones`` contra las
implementaciones NAIVE originales (copiadas literalmente en este script),
usando igualdad exacta ``==`` de floats (sin tolerancia), verificando los
contratos de error y midiendo tiempos antes/después.
"""

import os
import platform
import random
import sys
import time

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(REPO_ROOT, "src"))

from lib.KafeNUMK import funciones as numk  # noqa: E402

OUT_MD = os.path.join(os.path.dirname(os.path.abspath(__file__)), "conv_equiv_results.md")


# ---------------------------------------------------------------------------
# Implementaciones NAIVE originales (copiadas literalmente)
# ---------------------------------------------------------------------------

def conv_naive(input_data, kernels, bias, stride=1, padding="valid"):
    in_shape = numk.shape(input_data)
    kernel_shape = numk.shape(kernels)
    if len(in_shape) != 3 or len(kernel_shape) != 4:
        raise ValueError("NUMK: conv2d_chw requiere CHW y kernels FCHW")
    channels, height, width = in_shape
    filters, kernel_channels, kh, kw = kernel_shape
    if channels != kernel_channels or len(bias) != filters:
        raise ValueError("NUMK: canales o bias incompatibles en conv2d")
    if type(stride) is not int or stride <= 0:
        raise ValueError("NUMK: stride debe ser entero positivo")
    if padding not in ("valid", "same"):
        raise ValueError("NUMK: padding debe ser valid o same")
    pad_h = (kh - 1) // 2 if padding == "same" else 0
    pad_w = (kw - 1) // 2 if padding == "same" else 0
    out_h = (height + 2 * pad_h - kh) // stride + 1
    out_w = (width + 2 * pad_w - kw) // stride + 1
    if out_h <= 0 or out_w <= 0:
        raise ValueError("NUMK: kernel mayor que la entrada")
    output = numk.zeros_nd([filters, out_h, out_w])
    for f in range(filters):
        for oy in range(out_h):
            for ox in range(out_w):
                value = bias[f]
                for c in range(channels):
                    for ky in range(kh):
                        iy = oy * stride + ky - pad_h
                        if iy < 0 or iy >= height:
                            continue
                        for kx in range(kw):
                            ix = ox * stride + kx - pad_w
                            if 0 <= ix < width:
                                value += input_data[c][iy][ix] * kernels[f][c][ky][kx]
                output[f][oy][ox] = value
    return output


def conv_backward_naive(input_data, kernels, grad_output, stride=1, padding="valid"):
    channels, height, width = numk.shape(input_data)
    filters, kernel_channels, kh, kw = numk.shape(kernels)
    if channels != kernel_channels:
        raise ValueError("NUMK: canales incompatibles en backward conv2d")
    expected = numk.shape(numk.conv2d_chw(input_data, kernels, [0.0] * filters, stride, padding))
    if numk.shape(grad_output) != expected:
        raise ValueError("NUMK: grad_output incompatible en backward conv2d")
    pad_h = (kh - 1) // 2 if padding == "same" else 0
    pad_w = (kw - 1) // 2 if padding == "same" else 0
    dx = numk.zeros_nd([channels, height, width])
    dw = numk.zeros_nd([filters, channels, kh, kw])
    db = numk.zeros_nd([filters])
    for f in range(filters):
        for oy in range(expected[1]):
            for ox in range(expected[2]):
                grad = grad_output[f][oy][ox]
                db[f] += grad
                for c in range(channels):
                    for ky in range(kh):
                        iy = oy * stride + ky - pad_h
                        if iy < 0 or iy >= height:
                            continue
                        for kx in range(kw):
                            ix = ox * stride + kx - pad_w
                            if 0 <= ix < width:
                                dw[f][c][ky][kx] += input_data[c][iy][ix] * grad
                                dx[c][iy][ix] += kernels[f][c][ky][kx] * grad
    return dx, dw, db


# ---------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------

def rand_list(shape, rng):
    """Lista anidada de floats pseudoaleatorios en [-1.0, 1.0]."""
    if len(shape) == 1:
        return [round(rng.uniform(-1.0, 1.0), 12) for _ in range(shape[0])]
    return [rand_list(shape[1:], rng) for _ in range(shape[0])]


def first_diff(a, b, path=()):
    """Ruta al primer elemento que difiere entre dos estructuras anidadas."""
    if isinstance(a, (list, tuple)):
        if not isinstance(b, (list, tuple)):
            return path + ("tipo", type(a).__name__, type(b).__name__, a, b)
        if len(a) != len(b):
            return path + ("len", len(a), len(b))
        for i, (x, y) in enumerate(zip(a, b)):
            d = first_diff(x, y, path + (i,))
            if d is not None:
                return d
        return None
    if a != b:
        return path + (a, b)
    return None


def time_ms(fn, reps=5):
    """Mediana (5 repeticiones) del tiempo de ejecucion en ms."""
    samples = []
    for _ in range(reps):
        t0 = time.perf_counter()
        fn()
        samples.append((time.perf_counter() - t0) * 1000.0)
    samples.sort()
    return samples[reps // 2]


def run_contract(fn, expected_msg):
    """Ejecuta fn; expected_msg=None significa 'no debe lanzar excepcion'."""
    try:
        fn()
    except Exception as exc:  # noqa: BLE001
        if expected_msg is None:
            return False, "lanza {} inesperado: {}".format(type(exc).__name__, exc)
        if not isinstance(exc, ValueError):
            return False, "excepcion {} (se esperaba ValueError): {}".format(type(exc).__name__, exc)
        got = str(exc)
        return got == expected_msg, got
    else:
        if expected_msg is None:
            return True, "sin excepcion"
        return False, "sin excepcion (se esperaba: {})".format(expected_msg)


def main():
    rng = random.Random(1234)

    # -------------------------------------------------------------------------
    # 1. Equivalencia bit a bit
    # -------------------------------------------------------------------------
    channels_opts = (1, 3)
    filters_opts = (1, 2, 8)
    kernel_opts = ((1, 1), (2, 2), (3, 3), (5, 5))
    stride_opts = (1, 2)
    padding_opts = ("valid", "same")
    size_opts = ((5, 5), (8, 8), (32, 32))

    total_cases = (
        len(channels_opts) * len(filters_opts) * len(kernel_opts)
        * len(stride_opts) * len(padding_opts) * len(size_opts)
    )
    case_rows = []
    n_ok = 0
    n_bad = 0
    idx = 0

    print("== Equivalencia bit a bit (== exacto, sin tolerancia) ==")
    for channels in channels_opts:
        for filters in filters_opts:
            for kh, kw in kernel_opts:
                for stride in stride_opts:
                    for padding in padding_opts:
                        for height, width in size_opts:
                            idx += 1
                            input_data = rand_list([channels, height, width], rng)
                            kernels = rand_list([filters, channels, kh, kw], rng)
                            bias = rand_list([filters], rng)
                            status = "OK"
                            detail = ""
                            try:
                                fwd_new = numk.conv2d_chw(input_data, kernels, bias, stride, padding)
                                fwd_old = conv_naive(input_data, kernels, bias, stride, padding)
                                fwd_ok = fwd_new == fwd_old

                                out_shape = list(numk.shape(numk.conv2d_chw(
                                    input_data, kernels, bias, stride, padding)))
                                grad_output = rand_list(out_shape, rng)

                                bwd_new = numk.conv2d_chw_backward(
                                    input_data, kernels, grad_output, stride, padding)
                                bwd_old = conv_backward_naive(
                                    input_data, kernels, grad_output, stride, padding)
                                dx_ok = bwd_new[0] == bwd_old[0]
                                dw_ok = bwd_new[1] == bwd_old[1]
                                db_ok = bwd_new[2] == bwd_old[2]

                                parts = []
                                if not fwd_ok:
                                    parts.append("forward: primer diff en {}".format(
                                        first_diff(fwd_new, fwd_old)))
                                if not dx_ok:
                                    parts.append("dx: primer diff en {}".format(
                                        first_diff(bwd_new[0], bwd_old[0])))
                                if not dw_ok:
                                    parts.append("dw: primer diff en {}".format(
                                        first_diff(bwd_new[1], bwd_old[1])))
                                if not db_ok:
                                    parts.append("db: primer diff en {}".format(
                                        first_diff(bwd_new[2], bwd_old[2])))
                                if parts:
                                    status = "MISMATCH"
                                    detail = " | ".join(str(p) for p in parts)
                                else:
                                    status = "OK"
                                    detail = ""
                            except Exception as exc:  # noqa: BLE001
                                status = "MISMATCH"
                                detail = "excepcion: {}: {}".format(type(exc).__name__, exc)

                            if status == "OK":
                                n_ok += 1
                            else:
                                n_bad += 1
                                print("  [{}] MISMATCH c={} f={} k={}x{} s={} p={} {}x{}".format(
                                    idx, channels, filters, kh, kw, stride, padding, height, width))
                                print("      {}".format(detail))

                            case_rows.append({
                                "idx": idx, "channels": channels, "filters": filters,
                                "kh": kh, "kw": kw, "stride": stride, "padding": padding,
                                "height": height, "width": width,
                                "status": status, "detail": detail,
                            })

    print("Casos: {} | OK: {} | MISMATCH: {}".format(total_cases, n_ok, n_bad))

    # -------------------------------------------------------------------------
    # 2. Contratos de error
    # -------------------------------------------------------------------------
    print("== Contratos de error ==")
    contracts = []

    def add_contract(label, fn, expected_msg):
        ok, got = run_contract(fn, expected_msg)
        contracts.append({
            "label": label,
            "expected": "(sin excepcion)" if expected_msg is None else expected_msg,
            "got": got,
            "ok": ok,
        })
        print("  [{}] {} -> {}".format("PASS" if ok else "FAIL", label, got))

    v_in = rand_list([2, 4, 4], rng)
    v_k = rand_list([3, 2, 3, 3], rng)
    v_b = rand_list([3], rng)
    v_grad = rand_list([3, 4, 4], rng)  # same: 4x4 -> 4x4

    add_contract("Llamada VALIDA forward no lanza excepcion",
                 lambda: numk.conv2d_chw(v_in, v_k, v_b, 1, "same"), None)
    add_contract("Llamada VALIDA backward no lanza excepcion",
                 lambda: numk.conv2d_chw_backward(v_in, v_k, v_grad, 1, "same"), None)
    add_contract("backward con stride=0",
                 lambda: numk.conv2d_chw_backward(v_in, v_k, v_grad, 0, "same"),
                 "NUMK: stride debe ser entero positivo")
    add_contract("backward con padding='reflect'",
                 lambda: numk.conv2d_chw_backward(v_in, v_k, v_grad, 1, "reflect"),
                 "NUMK: padding debe ser valid o same")

    k_in = rand_list([1, 3, 3], rng)
    k_k = rand_list([1, 1, 5, 5], rng)
    add_contract("backward kernel 5x5 > entrada 3x3 (valid)",
                 lambda: numk.conv2d_chw_backward(k_in, k_k, [[[0.0]]], 1, "valid"),
                 "NUMK: kernel mayor que la entrada")

    g_in = rand_list([1, 4, 4], rng)
    g_k = rand_list([1, 1, 3, 3], rng)
    add_contract("backward con grad_output de forma incorrecta",
                 lambda: numk.conv2d_chw_backward(g_in, g_k, rand_list([1, 3, 3], rng), 1, "valid"),
                 "NUMK: grad_output incompatible en backward conv2d")

    c_in = rand_list([2, 4, 4], rng)
    c_k = rand_list([1, 1, 3, 3], rng)
    add_contract("backward con canales incompatibles (2 != 1)",
                 lambda: numk.conv2d_chw_backward(c_in, c_k, rand_list([1, 2, 2], rng), 1, "valid"),
                 "NUMK: canales incompatibles en backward conv2d")

    add_contract("forward con padding='reflect'",
                 lambda: numk.conv2d_chw(v_in, v_k, v_b, 1, "reflect"),
                 "NUMK: padding debe ser valid o same")
    add_contract("forward con stride=0",
                 lambda: numk.conv2d_chw(v_in, v_k, v_b, 0, "same"),
                 "NUMK: stride debe ser entero positivo")

    contracts_fail = [c for c in contracts if not c["ok"]]

    # -------------------------------------------------------------------------
    # 3. Medicion de tiempos (mediana de 5, time.perf_counter, sin tracemalloc)
    # -------------------------------------------------------------------------
    print("== Medicion de tiempos (mediana de 5 repeticiones) ==")
    c1_in = rand_list([3, 32, 32], rng)
    c1_k = rand_list([8, 3, 3, 3], rng)
    c1_b = rand_list([8], rng)
    c1_out = list(numk.shape(numk.conv2d_chw(c1_in, c1_k, c1_b, 1, "same")))
    c1_g = rand_list(c1_out, rng)

    c2_in = rand_list([8, 16, 16], rng)
    c2_k = rand_list([16, 8, 3, 3], rng)
    c2_b = rand_list([16], rng)
    c2_out = list(numk.shape(numk.conv2d_chw(c2_in, c2_k, c2_b, 1, "same")))
    c2_g = rand_list(c2_out, rng)

    benchmarks = [
        ("conv1 fwd", 84.096,
         lambda: conv_naive(c1_in, c1_k, c1_b, 1, "same"),
         lambda: numk.conv2d_chw(c1_in, c1_k, c1_b, 1, "same")),
        ("conv1 bwd", 142.367,
         lambda: conv_backward_naive(c1_in, c1_k, c1_g, 1, "same"),
         lambda: numk.conv2d_chw_backward(c1_in, c1_k, c1_g, 1, "same")),
        ("conv2 fwd", 75.404,
         lambda: conv_naive(c2_in, c2_k, c2_b, 1, "same"),
         lambda: numk.conv2d_chw(c2_in, c2_k, c2_b, 1, "same")),
        ("conv2 bwd", 198.393,
         lambda: conv_backward_naive(c2_in, c2_k, c2_g, 1, "same"),
         lambda: numk.conv2d_chw_backward(c2_in, c2_k, c2_g, 1, "same")),
    ]

    timing_rows = []
    for name, base, fn_naive, fn_numk in benchmarks:
        naive_ms = time_ms(fn_naive)
        numk_ms = time_ms(fn_numk)
        factor = naive_ms / numk_ms if numk_ms > 0 else float("inf")
        timing_rows.append((name, base, naive_ms, numk_ms, factor))
        print("  {}: antes {:8.3f} ms | despues {:8.3f} ms | base {:8.3f} ms | x{:.2f}".format(
            name, naive_ms, numk_ms, base, factor))

    # -------------------------------------------------------------------------
    # 4. Informe
    # -------------------------------------------------------------------------
    verdict = "SI" if (n_bad == 0 and not contracts_fail) else "NO"
    lines = []
    lines.append("# Verificacion de equivalencia conv2d_chw / conv2d_chw_backward")
    lines.append("")
    lines.append("- Fecha: {}".format(time.strftime("%Y-%m-%d %H:%M:%S")))
    lines.append("- Python: {}".format(platform.python_version()))
    lines.append("- Script: `.opencode/benchmarks/conv_equiv.py`")
    lines.append("- Datos: `random.Random(1234)`, floats en [-1.0, 1.0] con `round(uniform, 12)`")
    lines.append("- Comparacion: igualdad exacta `==` de floats (NO `pytest.approx`)")
    lines.append("")
    lines.append("## Salvedad metodologica")
    lines.append("")
    lines.append("`conv_backward_naive` (copia literal del original) calcula `expected` con "
                 "`numk.shape(numk.conv2d_chw(...))`, es decir, llama a la version YA optimizada "
                 "de `conv2d_chw`. Esto es intencional y no afecta a la verificacion de "
                 "equivalencia: ese valor se usa **solo para obtener la FORMA** de salida "
                 "(dims de `grad_output` y bucles `oy`/`ox`), nunca para los valores "
                 "comparados de `dx`, `dw` ni `db`.")
    lines.append("")
    lines.append("## 1. Equivalencia bit a bit")
    lines.append("")
    lines.append("- Combinaciones comparadas: **{}**".format(total_cases))
    lines.append("- OK: **{}** | MISMATCH: **{}**".format(n_ok, n_bad))
    lines.append("- Comparaciones individuales por caso: forward `output`, backward `dx`, `dw`, `db`")
    lines.append("")
    lines.append("| # | ch | filt | kernel | stride | padding | entrada | caso | detalle |")
    lines.append("|---:|---:|---:|---:|---:|---|---:|---|---|")
    for r in case_rows:
        lines.append("| {} | {} | {} | {}x{} | {} | {} | {}x{} | {} | {} |".format(
            r["idx"], r["channels"], r["filters"], r["kh"], r["kw"], r["stride"],
            r["padding"], r["height"], r["width"], r["status"],
            r["detail"].replace("|", "\\|") if r["detail"] else ""))
    lines.append("")
    lines.append("## 2. Contratos de error")
    lines.append("")
    lines.append("| # | Contrato | Mensaje esperado | Mensaje obtenido | Resultado |")
    lines.append("|---:|---|---|---|---|")
    for i, c in enumerate(contracts, 1):
        lines.append("| {} | {} | `{}` | `{}` | {} |".format(
            i, c["label"], c["expected"], c["got"], "PASS" if c["ok"] else "FAIL"))
    lines.append("")
    lines.append("## 3. Tiempos antes / despues")
    lines.append("")
    lines.append("Mediana de 5 repeticiones con `time.perf_counter` (sin `tracemalloc`). "
                 "Formas de la CNN de `src/Ejemplo.kf`: conv1 `[3,32,32]`->kernels `[8,3,3,3]`; "
                 "conv2 `[8,16,16]`->kernels `[16,8,3,3]`; stride 1, padding `same`.")
    lines.append("")
    lines.append("| Operacion | Base previa (ms) | Antes - naive (ms) | Despues - numk (ms) | Factor mejora |")
    lines.append("|---|---:|---:|---:|---:|")
    for name, base, naive_ms, numk_ms, factor in timing_rows:
        lines.append("| {} | {:.3f} | {:.3f} | {:.3f} | x{:.2f} |".format(
            name, base, naive_ms, numk_ms, factor))
    lines.append("")
    lines.append("## Conclusion")
    lines.append("")
    lines.append("BIT-IDENTICO: {}".format(verdict))
    lines.append("")

    with open(OUT_MD, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))

    print("")
    print("BIT-IDENTICO: {}".format(verdict))
    print("Total de casos comparados: {}".format(total_cases))
    print("Informe escrito en: {}".format(OUT_MD))


if __name__ == "__main__":
    main()
