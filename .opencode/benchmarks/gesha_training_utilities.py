"""Cinco escenarios reproducibles; ejecutar con PYTHONPATH=src python ..."""
from time import perf_counter
from lib.KafeGESHA.initializers import GlorotUniform, HeNormal, Orthogonal
from lib.KafeGESHA.regularizers import L1L2

CASES = [('small',[10,3]), ('medium',[300,8]), ('edge',[1,1]),
         ('multi_feature',[64,32]), ('stress',[1000,128])]
for name, shape in CASES:
    start=perf_counter(); weights=HeNormal(seed=7)(shape); penalty=L1L2(1e-4,1e-4).penalty(weights)
    print(name, f"{perf_counter()-start:.6f}s", penalty)
# Operaciones específicas que no caben en todos los escenarios.
GlorotUniform(seed=7)([32,32]); Orthogonal(seed=7)([32,16])
