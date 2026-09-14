# Current Work

| Field | Value |
|-------|-------|
| Feature | Expose tensor functions in geshaDeep API + fixture tests |
| Status | done |
| Current step | Tests passing (344 passed) |
| Next step | N/A |
| Blockers | N/A |
| Related ADRs | N/A |

## Notes

- **Funciones expuestas en `funciones.py`**:
  - `tensor_zeros(shape)` — crea tensor de ceros con forma dada
  - `tensor_ones(shape)` — crea tensor de unos con forma dada
  - `tensor_random(shape)` — crea tensor con valores aleatorios
  - `tensor(data)` — crea tensor desde datos anidados
- **Tipos**: `shape` acepta `vector_numeros_t` (List[INT] o List[FLOAT]); `data` acepta `lista_cualquiera_t`
- **Limitación conocida**: El tipo `Tensor` no está registrado en el sistema de tipos de KAFE, por lo que no se puede asignar a variables tipadas. Se usa inline con `show()` o como expresión descartada.
- **Fixtures creados** (5 pares .kf/.expec):
  - `test_tensor_create` — crea tensor desde datos
  - `test_tensor_zeros` — tensor de ceros
  - `test_tensor_ones` — tensor de unos
  - `test_tensor_nd` — tensor 3D
  - `test_tensor_random` — verifica ejecución exitosa
- **test_tensor.py** reescrito con patrón subprocess, filtrando solo `test_tensor_*.kf`
- **344 tests pasaron exitosamente** (5 nuevos + 339 existentes)
