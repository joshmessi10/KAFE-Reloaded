# Verificacion de equivalencia conv2d_chw / conv2d_chw_backward

- Fecha: 2026-10-17 20:16:13
- Python: 3.13.11
- Script: `.opencode/benchmarks/conv_equiv.py`
- Datos: `random.Random(1234)`, floats en [-1.0, 1.0] con `round(uniform, 12)`
- Comparacion: igualdad exacta `==` de floats (NO `pytest.approx`)

## Salvedad metodologica

`conv_backward_naive` (copia literal del original) calcula `expected` con `numk.shape(numk.conv2d_chw(...))`, es decir, llama a la version YA optimizada de `conv2d_chw`. Esto es intencional y no afecta a la verificacion de equivalencia: ese valor se usa **solo para obtener la FORMA** de salida (dims de `grad_output` y bucles `oy`/`ox`), nunca para los valores comparados de `dx`, `dw` ni `db`.

## 1. Equivalencia bit a bit

- Combinaciones comparadas: **288**
- OK: **288** | MISMATCH: **0**
- Comparaciones individuales por caso: forward `output`, backward `dx`, `dw`, `db`

| # | ch | filt | kernel | stride | padding | entrada | caso | detalle |
|---:|---:|---:|---:|---:|---|---:|---|---|
| 1 | 1 | 1 | 1x1 | 1 | valid | 5x5 | OK |  |
| 2 | 1 | 1 | 1x1 | 1 | valid | 8x8 | OK |  |
| 3 | 1 | 1 | 1x1 | 1 | valid | 32x32 | OK |  |
| 4 | 1 | 1 | 1x1 | 1 | same | 5x5 | OK |  |
| 5 | 1 | 1 | 1x1 | 1 | same | 8x8 | OK |  |
| 6 | 1 | 1 | 1x1 | 1 | same | 32x32 | OK |  |
| 7 | 1 | 1 | 1x1 | 2 | valid | 5x5 | OK |  |
| 8 | 1 | 1 | 1x1 | 2 | valid | 8x8 | OK |  |
| 9 | 1 | 1 | 1x1 | 2 | valid | 32x32 | OK |  |
| 10 | 1 | 1 | 1x1 | 2 | same | 5x5 | OK |  |
| 11 | 1 | 1 | 1x1 | 2 | same | 8x8 | OK |  |
| 12 | 1 | 1 | 1x1 | 2 | same | 32x32 | OK |  |
| 13 | 1 | 1 | 2x2 | 1 | valid | 5x5 | OK |  |
| 14 | 1 | 1 | 2x2 | 1 | valid | 8x8 | OK |  |
| 15 | 1 | 1 | 2x2 | 1 | valid | 32x32 | OK |  |
| 16 | 1 | 1 | 2x2 | 1 | same | 5x5 | OK |  |
| 17 | 1 | 1 | 2x2 | 1 | same | 8x8 | OK |  |
| 18 | 1 | 1 | 2x2 | 1 | same | 32x32 | OK |  |
| 19 | 1 | 1 | 2x2 | 2 | valid | 5x5 | OK |  |
| 20 | 1 | 1 | 2x2 | 2 | valid | 8x8 | OK |  |
| 21 | 1 | 1 | 2x2 | 2 | valid | 32x32 | OK |  |
| 22 | 1 | 1 | 2x2 | 2 | same | 5x5 | OK |  |
| 23 | 1 | 1 | 2x2 | 2 | same | 8x8 | OK |  |
| 24 | 1 | 1 | 2x2 | 2 | same | 32x32 | OK |  |
| 25 | 1 | 1 | 3x3 | 1 | valid | 5x5 | OK |  |
| 26 | 1 | 1 | 3x3 | 1 | valid | 8x8 | OK |  |
| 27 | 1 | 1 | 3x3 | 1 | valid | 32x32 | OK |  |
| 28 | 1 | 1 | 3x3 | 1 | same | 5x5 | OK |  |
| 29 | 1 | 1 | 3x3 | 1 | same | 8x8 | OK |  |
| 30 | 1 | 1 | 3x3 | 1 | same | 32x32 | OK |  |
| 31 | 1 | 1 | 3x3 | 2 | valid | 5x5 | OK |  |
| 32 | 1 | 1 | 3x3 | 2 | valid | 8x8 | OK |  |
| 33 | 1 | 1 | 3x3 | 2 | valid | 32x32 | OK |  |
| 34 | 1 | 1 | 3x3 | 2 | same | 5x5 | OK |  |
| 35 | 1 | 1 | 3x3 | 2 | same | 8x8 | OK |  |
| 36 | 1 | 1 | 3x3 | 2 | same | 32x32 | OK |  |
| 37 | 1 | 1 | 5x5 | 1 | valid | 5x5 | OK |  |
| 38 | 1 | 1 | 5x5 | 1 | valid | 8x8 | OK |  |
| 39 | 1 | 1 | 5x5 | 1 | valid | 32x32 | OK |  |
| 40 | 1 | 1 | 5x5 | 1 | same | 5x5 | OK |  |
| 41 | 1 | 1 | 5x5 | 1 | same | 8x8 | OK |  |
| 42 | 1 | 1 | 5x5 | 1 | same | 32x32 | OK |  |
| 43 | 1 | 1 | 5x5 | 2 | valid | 5x5 | OK |  |
| 44 | 1 | 1 | 5x5 | 2 | valid | 8x8 | OK |  |
| 45 | 1 | 1 | 5x5 | 2 | valid | 32x32 | OK |  |
| 46 | 1 | 1 | 5x5 | 2 | same | 5x5 | OK |  |
| 47 | 1 | 1 | 5x5 | 2 | same | 8x8 | OK |  |
| 48 | 1 | 1 | 5x5 | 2 | same | 32x32 | OK |  |
| 49 | 1 | 2 | 1x1 | 1 | valid | 5x5 | OK |  |
| 50 | 1 | 2 | 1x1 | 1 | valid | 8x8 | OK |  |
| 51 | 1 | 2 | 1x1 | 1 | valid | 32x32 | OK |  |
| 52 | 1 | 2 | 1x1 | 1 | same | 5x5 | OK |  |
| 53 | 1 | 2 | 1x1 | 1 | same | 8x8 | OK |  |
| 54 | 1 | 2 | 1x1 | 1 | same | 32x32 | OK |  |
| 55 | 1 | 2 | 1x1 | 2 | valid | 5x5 | OK |  |
| 56 | 1 | 2 | 1x1 | 2 | valid | 8x8 | OK |  |
| 57 | 1 | 2 | 1x1 | 2 | valid | 32x32 | OK |  |
| 58 | 1 | 2 | 1x1 | 2 | same | 5x5 | OK |  |
| 59 | 1 | 2 | 1x1 | 2 | same | 8x8 | OK |  |
| 60 | 1 | 2 | 1x1 | 2 | same | 32x32 | OK |  |
| 61 | 1 | 2 | 2x2 | 1 | valid | 5x5 | OK |  |
| 62 | 1 | 2 | 2x2 | 1 | valid | 8x8 | OK |  |
| 63 | 1 | 2 | 2x2 | 1 | valid | 32x32 | OK |  |
| 64 | 1 | 2 | 2x2 | 1 | same | 5x5 | OK |  |
| 65 | 1 | 2 | 2x2 | 1 | same | 8x8 | OK |  |
| 66 | 1 | 2 | 2x2 | 1 | same | 32x32 | OK |  |
| 67 | 1 | 2 | 2x2 | 2 | valid | 5x5 | OK |  |
| 68 | 1 | 2 | 2x2 | 2 | valid | 8x8 | OK |  |
| 69 | 1 | 2 | 2x2 | 2 | valid | 32x32 | OK |  |
| 70 | 1 | 2 | 2x2 | 2 | same | 5x5 | OK |  |
| 71 | 1 | 2 | 2x2 | 2 | same | 8x8 | OK |  |
| 72 | 1 | 2 | 2x2 | 2 | same | 32x32 | OK |  |
| 73 | 1 | 2 | 3x3 | 1 | valid | 5x5 | OK |  |
| 74 | 1 | 2 | 3x3 | 1 | valid | 8x8 | OK |  |
| 75 | 1 | 2 | 3x3 | 1 | valid | 32x32 | OK |  |
| 76 | 1 | 2 | 3x3 | 1 | same | 5x5 | OK |  |
| 77 | 1 | 2 | 3x3 | 1 | same | 8x8 | OK |  |
| 78 | 1 | 2 | 3x3 | 1 | same | 32x32 | OK |  |
| 79 | 1 | 2 | 3x3 | 2 | valid | 5x5 | OK |  |
| 80 | 1 | 2 | 3x3 | 2 | valid | 8x8 | OK |  |
| 81 | 1 | 2 | 3x3 | 2 | valid | 32x32 | OK |  |
| 82 | 1 | 2 | 3x3 | 2 | same | 5x5 | OK |  |
| 83 | 1 | 2 | 3x3 | 2 | same | 8x8 | OK |  |
| 84 | 1 | 2 | 3x3 | 2 | same | 32x32 | OK |  |
| 85 | 1 | 2 | 5x5 | 1 | valid | 5x5 | OK |  |
| 86 | 1 | 2 | 5x5 | 1 | valid | 8x8 | OK |  |
| 87 | 1 | 2 | 5x5 | 1 | valid | 32x32 | OK |  |
| 88 | 1 | 2 | 5x5 | 1 | same | 5x5 | OK |  |
| 89 | 1 | 2 | 5x5 | 1 | same | 8x8 | OK |  |
| 90 | 1 | 2 | 5x5 | 1 | same | 32x32 | OK |  |
| 91 | 1 | 2 | 5x5 | 2 | valid | 5x5 | OK |  |
| 92 | 1 | 2 | 5x5 | 2 | valid | 8x8 | OK |  |
| 93 | 1 | 2 | 5x5 | 2 | valid | 32x32 | OK |  |
| 94 | 1 | 2 | 5x5 | 2 | same | 5x5 | OK |  |
| 95 | 1 | 2 | 5x5 | 2 | same | 8x8 | OK |  |
| 96 | 1 | 2 | 5x5 | 2 | same | 32x32 | OK |  |
| 97 | 1 | 8 | 1x1 | 1 | valid | 5x5 | OK |  |
| 98 | 1 | 8 | 1x1 | 1 | valid | 8x8 | OK |  |
| 99 | 1 | 8 | 1x1 | 1 | valid | 32x32 | OK |  |
| 100 | 1 | 8 | 1x1 | 1 | same | 5x5 | OK |  |
| 101 | 1 | 8 | 1x1 | 1 | same | 8x8 | OK |  |
| 102 | 1 | 8 | 1x1 | 1 | same | 32x32 | OK |  |
| 103 | 1 | 8 | 1x1 | 2 | valid | 5x5 | OK |  |
| 104 | 1 | 8 | 1x1 | 2 | valid | 8x8 | OK |  |
| 105 | 1 | 8 | 1x1 | 2 | valid | 32x32 | OK |  |
| 106 | 1 | 8 | 1x1 | 2 | same | 5x5 | OK |  |
| 107 | 1 | 8 | 1x1 | 2 | same | 8x8 | OK |  |
| 108 | 1 | 8 | 1x1 | 2 | same | 32x32 | OK |  |
| 109 | 1 | 8 | 2x2 | 1 | valid | 5x5 | OK |  |
| 110 | 1 | 8 | 2x2 | 1 | valid | 8x8 | OK |  |
| 111 | 1 | 8 | 2x2 | 1 | valid | 32x32 | OK |  |
| 112 | 1 | 8 | 2x2 | 1 | same | 5x5 | OK |  |
| 113 | 1 | 8 | 2x2 | 1 | same | 8x8 | OK |  |
| 114 | 1 | 8 | 2x2 | 1 | same | 32x32 | OK |  |
| 115 | 1 | 8 | 2x2 | 2 | valid | 5x5 | OK |  |
| 116 | 1 | 8 | 2x2 | 2 | valid | 8x8 | OK |  |
| 117 | 1 | 8 | 2x2 | 2 | valid | 32x32 | OK |  |
| 118 | 1 | 8 | 2x2 | 2 | same | 5x5 | OK |  |
| 119 | 1 | 8 | 2x2 | 2 | same | 8x8 | OK |  |
| 120 | 1 | 8 | 2x2 | 2 | same | 32x32 | OK |  |
| 121 | 1 | 8 | 3x3 | 1 | valid | 5x5 | OK |  |
| 122 | 1 | 8 | 3x3 | 1 | valid | 8x8 | OK |  |
| 123 | 1 | 8 | 3x3 | 1 | valid | 32x32 | OK |  |
| 124 | 1 | 8 | 3x3 | 1 | same | 5x5 | OK |  |
| 125 | 1 | 8 | 3x3 | 1 | same | 8x8 | OK |  |
| 126 | 1 | 8 | 3x3 | 1 | same | 32x32 | OK |  |
| 127 | 1 | 8 | 3x3 | 2 | valid | 5x5 | OK |  |
| 128 | 1 | 8 | 3x3 | 2 | valid | 8x8 | OK |  |
| 129 | 1 | 8 | 3x3 | 2 | valid | 32x32 | OK |  |
| 130 | 1 | 8 | 3x3 | 2 | same | 5x5 | OK |  |
| 131 | 1 | 8 | 3x3 | 2 | same | 8x8 | OK |  |
| 132 | 1 | 8 | 3x3 | 2 | same | 32x32 | OK |  |
| 133 | 1 | 8 | 5x5 | 1 | valid | 5x5 | OK |  |
| 134 | 1 | 8 | 5x5 | 1 | valid | 8x8 | OK |  |
| 135 | 1 | 8 | 5x5 | 1 | valid | 32x32 | OK |  |
| 136 | 1 | 8 | 5x5 | 1 | same | 5x5 | OK |  |
| 137 | 1 | 8 | 5x5 | 1 | same | 8x8 | OK |  |
| 138 | 1 | 8 | 5x5 | 1 | same | 32x32 | OK |  |
| 139 | 1 | 8 | 5x5 | 2 | valid | 5x5 | OK |  |
| 140 | 1 | 8 | 5x5 | 2 | valid | 8x8 | OK |  |
| 141 | 1 | 8 | 5x5 | 2 | valid | 32x32 | OK |  |
| 142 | 1 | 8 | 5x5 | 2 | same | 5x5 | OK |  |
| 143 | 1 | 8 | 5x5 | 2 | same | 8x8 | OK |  |
| 144 | 1 | 8 | 5x5 | 2 | same | 32x32 | OK |  |
| 145 | 3 | 1 | 1x1 | 1 | valid | 5x5 | OK |  |
| 146 | 3 | 1 | 1x1 | 1 | valid | 8x8 | OK |  |
| 147 | 3 | 1 | 1x1 | 1 | valid | 32x32 | OK |  |
| 148 | 3 | 1 | 1x1 | 1 | same | 5x5 | OK |  |
| 149 | 3 | 1 | 1x1 | 1 | same | 8x8 | OK |  |
| 150 | 3 | 1 | 1x1 | 1 | same | 32x32 | OK |  |
| 151 | 3 | 1 | 1x1 | 2 | valid | 5x5 | OK |  |
| 152 | 3 | 1 | 1x1 | 2 | valid | 8x8 | OK |  |
| 153 | 3 | 1 | 1x1 | 2 | valid | 32x32 | OK |  |
| 154 | 3 | 1 | 1x1 | 2 | same | 5x5 | OK |  |
| 155 | 3 | 1 | 1x1 | 2 | same | 8x8 | OK |  |
| 156 | 3 | 1 | 1x1 | 2 | same | 32x32 | OK |  |
| 157 | 3 | 1 | 2x2 | 1 | valid | 5x5 | OK |  |
| 158 | 3 | 1 | 2x2 | 1 | valid | 8x8 | OK |  |
| 159 | 3 | 1 | 2x2 | 1 | valid | 32x32 | OK |  |
| 160 | 3 | 1 | 2x2 | 1 | same | 5x5 | OK |  |
| 161 | 3 | 1 | 2x2 | 1 | same | 8x8 | OK |  |
| 162 | 3 | 1 | 2x2 | 1 | same | 32x32 | OK |  |
| 163 | 3 | 1 | 2x2 | 2 | valid | 5x5 | OK |  |
| 164 | 3 | 1 | 2x2 | 2 | valid | 8x8 | OK |  |
| 165 | 3 | 1 | 2x2 | 2 | valid | 32x32 | OK |  |
| 166 | 3 | 1 | 2x2 | 2 | same | 5x5 | OK |  |
| 167 | 3 | 1 | 2x2 | 2 | same | 8x8 | OK |  |
| 168 | 3 | 1 | 2x2 | 2 | same | 32x32 | OK |  |
| 169 | 3 | 1 | 3x3 | 1 | valid | 5x5 | OK |  |
| 170 | 3 | 1 | 3x3 | 1 | valid | 8x8 | OK |  |
| 171 | 3 | 1 | 3x3 | 1 | valid | 32x32 | OK |  |
| 172 | 3 | 1 | 3x3 | 1 | same | 5x5 | OK |  |
| 173 | 3 | 1 | 3x3 | 1 | same | 8x8 | OK |  |
| 174 | 3 | 1 | 3x3 | 1 | same | 32x32 | OK |  |
| 175 | 3 | 1 | 3x3 | 2 | valid | 5x5 | OK |  |
| 176 | 3 | 1 | 3x3 | 2 | valid | 8x8 | OK |  |
| 177 | 3 | 1 | 3x3 | 2 | valid | 32x32 | OK |  |
| 178 | 3 | 1 | 3x3 | 2 | same | 5x5 | OK |  |
| 179 | 3 | 1 | 3x3 | 2 | same | 8x8 | OK |  |
| 180 | 3 | 1 | 3x3 | 2 | same | 32x32 | OK |  |
| 181 | 3 | 1 | 5x5 | 1 | valid | 5x5 | OK |  |
| 182 | 3 | 1 | 5x5 | 1 | valid | 8x8 | OK |  |
| 183 | 3 | 1 | 5x5 | 1 | valid | 32x32 | OK |  |
| 184 | 3 | 1 | 5x5 | 1 | same | 5x5 | OK |  |
| 185 | 3 | 1 | 5x5 | 1 | same | 8x8 | OK |  |
| 186 | 3 | 1 | 5x5 | 1 | same | 32x32 | OK |  |
| 187 | 3 | 1 | 5x5 | 2 | valid | 5x5 | OK |  |
| 188 | 3 | 1 | 5x5 | 2 | valid | 8x8 | OK |  |
| 189 | 3 | 1 | 5x5 | 2 | valid | 32x32 | OK |  |
| 190 | 3 | 1 | 5x5 | 2 | same | 5x5 | OK |  |
| 191 | 3 | 1 | 5x5 | 2 | same | 8x8 | OK |  |
| 192 | 3 | 1 | 5x5 | 2 | same | 32x32 | OK |  |
| 193 | 3 | 2 | 1x1 | 1 | valid | 5x5 | OK |  |
| 194 | 3 | 2 | 1x1 | 1 | valid | 8x8 | OK |  |
| 195 | 3 | 2 | 1x1 | 1 | valid | 32x32 | OK |  |
| 196 | 3 | 2 | 1x1 | 1 | same | 5x5 | OK |  |
| 197 | 3 | 2 | 1x1 | 1 | same | 8x8 | OK |  |
| 198 | 3 | 2 | 1x1 | 1 | same | 32x32 | OK |  |
| 199 | 3 | 2 | 1x1 | 2 | valid | 5x5 | OK |  |
| 200 | 3 | 2 | 1x1 | 2 | valid | 8x8 | OK |  |
| 201 | 3 | 2 | 1x1 | 2 | valid | 32x32 | OK |  |
| 202 | 3 | 2 | 1x1 | 2 | same | 5x5 | OK |  |
| 203 | 3 | 2 | 1x1 | 2 | same | 8x8 | OK |  |
| 204 | 3 | 2 | 1x1 | 2 | same | 32x32 | OK |  |
| 205 | 3 | 2 | 2x2 | 1 | valid | 5x5 | OK |  |
| 206 | 3 | 2 | 2x2 | 1 | valid | 8x8 | OK |  |
| 207 | 3 | 2 | 2x2 | 1 | valid | 32x32 | OK |  |
| 208 | 3 | 2 | 2x2 | 1 | same | 5x5 | OK |  |
| 209 | 3 | 2 | 2x2 | 1 | same | 8x8 | OK |  |
| 210 | 3 | 2 | 2x2 | 1 | same | 32x32 | OK |  |
| 211 | 3 | 2 | 2x2 | 2 | valid | 5x5 | OK |  |
| 212 | 3 | 2 | 2x2 | 2 | valid | 8x8 | OK |  |
| 213 | 3 | 2 | 2x2 | 2 | valid | 32x32 | OK |  |
| 214 | 3 | 2 | 2x2 | 2 | same | 5x5 | OK |  |
| 215 | 3 | 2 | 2x2 | 2 | same | 8x8 | OK |  |
| 216 | 3 | 2 | 2x2 | 2 | same | 32x32 | OK |  |
| 217 | 3 | 2 | 3x3 | 1 | valid | 5x5 | OK |  |
| 218 | 3 | 2 | 3x3 | 1 | valid | 8x8 | OK |  |
| 219 | 3 | 2 | 3x3 | 1 | valid | 32x32 | OK |  |
| 220 | 3 | 2 | 3x3 | 1 | same | 5x5 | OK |  |
| 221 | 3 | 2 | 3x3 | 1 | same | 8x8 | OK |  |
| 222 | 3 | 2 | 3x3 | 1 | same | 32x32 | OK |  |
| 223 | 3 | 2 | 3x3 | 2 | valid | 5x5 | OK |  |
| 224 | 3 | 2 | 3x3 | 2 | valid | 8x8 | OK |  |
| 225 | 3 | 2 | 3x3 | 2 | valid | 32x32 | OK |  |
| 226 | 3 | 2 | 3x3 | 2 | same | 5x5 | OK |  |
| 227 | 3 | 2 | 3x3 | 2 | same | 8x8 | OK |  |
| 228 | 3 | 2 | 3x3 | 2 | same | 32x32 | OK |  |
| 229 | 3 | 2 | 5x5 | 1 | valid | 5x5 | OK |  |
| 230 | 3 | 2 | 5x5 | 1 | valid | 8x8 | OK |  |
| 231 | 3 | 2 | 5x5 | 1 | valid | 32x32 | OK |  |
| 232 | 3 | 2 | 5x5 | 1 | same | 5x5 | OK |  |
| 233 | 3 | 2 | 5x5 | 1 | same | 8x8 | OK |  |
| 234 | 3 | 2 | 5x5 | 1 | same | 32x32 | OK |  |
| 235 | 3 | 2 | 5x5 | 2 | valid | 5x5 | OK |  |
| 236 | 3 | 2 | 5x5 | 2 | valid | 8x8 | OK |  |
| 237 | 3 | 2 | 5x5 | 2 | valid | 32x32 | OK |  |
| 238 | 3 | 2 | 5x5 | 2 | same | 5x5 | OK |  |
| 239 | 3 | 2 | 5x5 | 2 | same | 8x8 | OK |  |
| 240 | 3 | 2 | 5x5 | 2 | same | 32x32 | OK |  |
| 241 | 3 | 8 | 1x1 | 1 | valid | 5x5 | OK |  |
| 242 | 3 | 8 | 1x1 | 1 | valid | 8x8 | OK |  |
| 243 | 3 | 8 | 1x1 | 1 | valid | 32x32 | OK |  |
| 244 | 3 | 8 | 1x1 | 1 | same | 5x5 | OK |  |
| 245 | 3 | 8 | 1x1 | 1 | same | 8x8 | OK |  |
| 246 | 3 | 8 | 1x1 | 1 | same | 32x32 | OK |  |
| 247 | 3 | 8 | 1x1 | 2 | valid | 5x5 | OK |  |
| 248 | 3 | 8 | 1x1 | 2 | valid | 8x8 | OK |  |
| 249 | 3 | 8 | 1x1 | 2 | valid | 32x32 | OK |  |
| 250 | 3 | 8 | 1x1 | 2 | same | 5x5 | OK |  |
| 251 | 3 | 8 | 1x1 | 2 | same | 8x8 | OK |  |
| 252 | 3 | 8 | 1x1 | 2 | same | 32x32 | OK |  |
| 253 | 3 | 8 | 2x2 | 1 | valid | 5x5 | OK |  |
| 254 | 3 | 8 | 2x2 | 1 | valid | 8x8 | OK |  |
| 255 | 3 | 8 | 2x2 | 1 | valid | 32x32 | OK |  |
| 256 | 3 | 8 | 2x2 | 1 | same | 5x5 | OK |  |
| 257 | 3 | 8 | 2x2 | 1 | same | 8x8 | OK |  |
| 258 | 3 | 8 | 2x2 | 1 | same | 32x32 | OK |  |
| 259 | 3 | 8 | 2x2 | 2 | valid | 5x5 | OK |  |
| 260 | 3 | 8 | 2x2 | 2 | valid | 8x8 | OK |  |
| 261 | 3 | 8 | 2x2 | 2 | valid | 32x32 | OK |  |
| 262 | 3 | 8 | 2x2 | 2 | same | 5x5 | OK |  |
| 263 | 3 | 8 | 2x2 | 2 | same | 8x8 | OK |  |
| 264 | 3 | 8 | 2x2 | 2 | same | 32x32 | OK |  |
| 265 | 3 | 8 | 3x3 | 1 | valid | 5x5 | OK |  |
| 266 | 3 | 8 | 3x3 | 1 | valid | 8x8 | OK |  |
| 267 | 3 | 8 | 3x3 | 1 | valid | 32x32 | OK |  |
| 268 | 3 | 8 | 3x3 | 1 | same | 5x5 | OK |  |
| 269 | 3 | 8 | 3x3 | 1 | same | 8x8 | OK |  |
| 270 | 3 | 8 | 3x3 | 1 | same | 32x32 | OK |  |
| 271 | 3 | 8 | 3x3 | 2 | valid | 5x5 | OK |  |
| 272 | 3 | 8 | 3x3 | 2 | valid | 8x8 | OK |  |
| 273 | 3 | 8 | 3x3 | 2 | valid | 32x32 | OK |  |
| 274 | 3 | 8 | 3x3 | 2 | same | 5x5 | OK |  |
| 275 | 3 | 8 | 3x3 | 2 | same | 8x8 | OK |  |
| 276 | 3 | 8 | 3x3 | 2 | same | 32x32 | OK |  |
| 277 | 3 | 8 | 5x5 | 1 | valid | 5x5 | OK |  |
| 278 | 3 | 8 | 5x5 | 1 | valid | 8x8 | OK |  |
| 279 | 3 | 8 | 5x5 | 1 | valid | 32x32 | OK |  |
| 280 | 3 | 8 | 5x5 | 1 | same | 5x5 | OK |  |
| 281 | 3 | 8 | 5x5 | 1 | same | 8x8 | OK |  |
| 282 | 3 | 8 | 5x5 | 1 | same | 32x32 | OK |  |
| 283 | 3 | 8 | 5x5 | 2 | valid | 5x5 | OK |  |
| 284 | 3 | 8 | 5x5 | 2 | valid | 8x8 | OK |  |
| 285 | 3 | 8 | 5x5 | 2 | valid | 32x32 | OK |  |
| 286 | 3 | 8 | 5x5 | 2 | same | 5x5 | OK |  |
| 287 | 3 | 8 | 5x5 | 2 | same | 8x8 | OK |  |
| 288 | 3 | 8 | 5x5 | 2 | same | 32x32 | OK |  |

## 2. Contratos de error

| # | Contrato | Mensaje esperado | Mensaje obtenido | Resultado |
|---:|---|---|---|---|
| 1 | Llamada VALIDA forward no lanza excepcion | `(sin excepcion)` | `sin excepcion` | PASS |
| 2 | Llamada VALIDA backward no lanza excepcion | `(sin excepcion)` | `sin excepcion` | PASS |
| 3 | backward con stride=0 | `NUMK: stride debe ser entero positivo` | `NUMK: stride debe ser entero positivo` | PASS |
| 4 | backward con padding='reflect' | `NUMK: padding debe ser valid o same` | `NUMK: padding debe ser valid o same` | PASS |
| 5 | backward kernel 5x5 > entrada 3x3 (valid) | `NUMK: kernel mayor que la entrada` | `NUMK: kernel mayor que la entrada` | PASS |
| 6 | backward con grad_output de forma incorrecta | `NUMK: grad_output incompatible en backward conv2d` | `NUMK: grad_output incompatible en backward conv2d` | PASS |
| 7 | backward con canales incompatibles (2 != 1) | `NUMK: canales incompatibles en backward conv2d` | `NUMK: canales incompatibles en backward conv2d` | PASS |
| 8 | forward con padding='reflect' | `NUMK: padding debe ser valid o same` | `NUMK: padding debe ser valid o same` | PASS |
| 9 | forward con stride=0 | `NUMK: stride debe ser entero positivo` | `NUMK: stride debe ser entero positivo` | PASS |

## 3. Tiempos antes / despues

Mediana de 5 repeticiones con `time.perf_counter` (sin `tracemalloc`). Formas de la CNN de `src/Ejemplo.kf`: conv1 `[3,32,32]`->kernels `[8,3,3,3]`; conv2 `[8,16,16]`->kernels `[16,8,3,3]`; stride 1, padding `same`.

| Operacion | Base previa (ms) | Antes - naive (ms) | Despues - numk (ms) | Factor mejora |
|---|---:|---:|---:|---:|
| conv1 fwd | 84.096 | 122.387 | 62.526 | x1.96 |
| conv1 bwd | 142.367 | 221.061 | 94.404 | x2.34 |
| conv2 fwd | 75.404 | 105.024 | 62.779 | x1.67 |
| conv2 bwd | 198.393 | 244.546 | 88.456 | x2.76 |

## Conclusion

BIT-IDENTICO: SI
