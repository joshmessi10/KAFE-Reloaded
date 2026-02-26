import os


def get_programs(dir):
    archivos = []
    for filename in os.listdir(dir):
        if filename.endswith(".kf") and not ("_error" in filename):
            base = filename[:-3]
            archivos.append(os.path.join(dir, base))

    return archivos


def get_invalid_programs(dir):
    archivos = []
    for filename in os.listdir(dir):
        if filename.endswith("_error.kf"):
            base = filename[:-3]
            archivos.append(os.path.join(dir, base))

    return archivos


def obtener_parametros(programas):
    for base in programas:
        programa = base + ".kf"
        archivo_entrada = base + ".in"
        archivo_salida_esperada = base + ".expec"

        entrada = ""
        if os.path.isfile(archivo_entrada):
            with open(archivo_entrada, encoding="utf-8") as f:
                entrada = f.read()

        salida_esperada = ""
        if os.path.isfile(archivo_salida_esperada):
            with open(archivo_salida_esperada, encoding="utf-8") as f:
                salida_esperada = f.read()

        yield programa, entrada, salida_esperada
