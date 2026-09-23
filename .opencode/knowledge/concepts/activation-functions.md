# Activation Functions (Funciones de Activación)

## Category

Deep Learning — Componente de red neuronal

## Description

Las funciones de activación introducen **no linealidad** en las redes neuronales. Sin ellas,任意 composición de capas densas seguiría siendo una transformación lineal, incapaz de modelar relaciones complejas.

Cada función de activación $\sigma: \mathbb{R} \rightarrow \mathbb{R}$ (o $\sigma: \mathbb{R}^k \rightarrow \mathbb{R}^k$ para Softmax) transforma la pre-activación $z$ en una salida $a = \sigma(z)$. La derivada $\sigma'(z)$ es esencial para la retropropagación.

KafeGESHA implementa 6 funciones de activación desde cero:

| Función | Fórmula | Rango | Uso principal |
|---|---|---|---|
| Sigmoide | $\sigma(x) = \frac{1}{1 + e^{-x}}$ | $(0, 1)$ | Salidas de probabilidad, binary classification |
| ReLU | $f(x) = \max(0, x)$ | $[0, \infty)$ | Capas ocultas (estándar) |
| Tanh | $\tanh(x) = \frac{e^x - e^{-x}}{e^x + e^{-x}}$ | $(-1, 1)$ | Capas ocultas (centrada en cero) |
| Softmax | $\text{softmax}(z_i) = \frac{e^{z_i}}{\sum_j e^{z_j}}$ | $(0, 1), \sum = 1$ | Salida de clasificación multiclase |
| Identidad | $f(x) = x$ | $(-\infty, \infty)$ | Regresión lineal |
| Escalonada | $f(x) = \begin{cases} 1 & x \geq 0 \\ 0 & x < 0 \end{cases}$ | $\{0, 1\}$ | Perceptrón binario |

## Mathematical Foundation

### Sigmoide

$$\sigma(x) = \frac{1}{1 + e^{-x}}$$

**Derivada** (usando la propiedad $\sigma'(x) = \sigma(x)(1 - \sigma(x))$):

$$\sigma'(x) = \sigma(x) \cdot (1 - \sigma(x))$$

**Propiedades**:
- Rango: $(0, 1)$ — interpretable como probabilidad
- Monotón creciente
- $\sigma(0) = 0.5$
- $\lim_{x \to \infty} \sigma(x) = 1$, $\lim_{x \to -\infty} \sigma(x) = 0$
- **Problema**: gradientes pequeños para $|x|$ grande → vanishing gradient

### ReLU (Rectified Linear Unit)

$$f(x) = \max(0, x) = \begin{cases} x & \text{si } x > 0 \\ 0 & \text{si } x \leq 0 \end{cases}$$

**Derivada**:

$$f'(x) = \begin{cases} 1 & \text{si } x > 0 \\ 0 & \text{si } x \leq 0 \end{cases}$$

**Propiedades**:
- Rango: $[0, \infty)$
- No acota los gradientes positivos → mitiga vanishing gradient
- **Dead ReLU**: si $x < 0$ siempre, la neurona "muere" (gradiente cero)
- La derivada en $x = 0$ no está definida; KafeGESHA usa $f'(0) = 0$

### Tanh (Tangente Hiperbólica)

$$\tanh(x) = \frac{e^x - e^{-x}}{e^x + e^{-x}} = 2\sigma(2x) - 1$$

**Derivada**:

$$\tanh'(x) = 1 - \tanh^2(x)$$

**Propiedades**:
- Rango: $(-1, 1)$ — salida centrada en cero
- Más estable que Sigmoide para capas ocultas
- Sigue teniendo vanishing gradient para $|x|$ grande

### Softmax

$$\text{softmax}(z_i) = \frac{e^{z_i}}{\sum_{j=1}^{k} e^{z_j}}$$

**Matriz Jacobiana**:

$$\frac{\partial \text{softmax}(z_i)}{\partial z_j} = \begin{cases} s_i(1 - s_i) & \text{si } i = j \\ -s_i \cdot s_j & \text{si } i \neq j \end{cases}$$

Donde $s_i = \text{softmax}(z_i)$.

**Propiedades**:
- Transforma un vector de logits en probabilidades (suma = 1)
- Diferenciable everywhere
- Equivario a escala: $\text{softmax}(z) = \text{softmax}(z + c)$ para cualquier constante $c$

### Identidad

$$f(x) = x, \quad f'(x) = 1$$

Usada para capas de salida en regresión donde la predicción debe ser un valor continuo sin restricción.

### Escalonada (Step)

$$f(x) = \begin{cases} 1 & x \geq 0 \\ 0 & x < 0 \end{cases}, \quad f'(x) = 0$$

El perceptrón clásico de Rosenblatt. La derivada es cero几乎 everywhere, por lo que no es apta para retropropagación. KafeGESHA la incluye con fines educativos.

## Step-by-Step Algorithm

### Cálculo de Forward (usando Sigmoid como ejemplo)

1. Recibir pre-activación $z$.
2. Calcular $e^{-z}$ usando la función exponencial.
3. Calcular $\sigma(z) = \frac{1}{1 + e^{-z}}$.
4. Almacenar $\sigma(z)$ para usar en backward.
5. Retornar $\sigma(z)$.

### Cálculo de Backward (derivada)

6. Si se almacenó la salida $\sigma(z)$ en forward:
   - Retornar $\sigma(z) \cdot (1 - \sigma(z))$ (reutiliza el valor calculado).
7. Si no se almacenó:
   - Recalcular $\sigma(z)$ y retornar $\sigma(z) \cdot (1 - \sigma(z))$.

### Cálculo de Softmax (forward)

8. Recibir vector $\mathbf{z} \in \mathbb{R}^k$.
9. Calcular $e^{z_i}$ para cada componente.
10. Sumar $\sum_{j=1}^{k} e^{z_j}$.
11. Dividir: $s_i = \frac{e^{z_i}}{\sum_j e^{z_j}}$.
12. Retornar vector $\mathbf{s}$.

### Cálculo de Softmax (derivada — Jacobiana)

13. Calcular $\mathbf{s} = \text{softmax}(\mathbf{z})$.
14. Para cada par $(i, j)$:
    - Si $i = j$: $J_{ij} = s_i(1 - s_i)$.
    - Si $i \neq j$: $J_{ij} = -s_i \cdot s_j$.
15. Retornar matriz Jacobiana $J \in \mathbb{R}^{k \times k}$.

## Motivation

Las funciones de activación son la razón por la cual las redes neuronales profundas pueden aprender representaciones complejas. Sin no linealidad, una red de $L$ capas es equivalente a una sola transformación lineal $W_L \cdots W_1 x$. KafeGESHA implementa cada función desde cero para que el estudiante vea exactamente qué計算 ocurre en cada forward y backward pass.

## Advantages

- **Reutilización de valores**: Tanto Sigmoid como Tanh almacenan la salida de forward para calcular la derivada sin re-calcular la exponencial.
- **Derivadas analíticas**: Todas las funciones (excepto Escalonada) tienen derivadas cerradas, eficientes para retropropagación.
- **Selectividad de Softmax**: Se aplica al vector completo (no elemento por elemento), correctamente implementado como caso especial en Dense.
- **Diversidad de rangos**: Cada función produce salidas en un rango apropiado para su caso de uso.

## Limitations

- **Dead neurons (ReLU)**: Si una neurona ReLU siempre recibe pre-activación negativa, su gradiente es cero y nunca se actualiza.
- **Vanishing gradient (Sigmoide, Tanh)**: Para entradas grandes en magnitud, los gradientes se vuelven muy pequeños, ralentizando el aprendizaje en capas profundas.
- **No definida en 0 (ReLo)**: La derivada de ReLU en exactamente cero no está definida; KafeGESHA usa 0 como convención.
- **Escalonada no entrenable**: Su derivada es siempre cero, making it useless for gradient-based learning.

## When to Use

- **Sigmoide**: Capa de salida para binary classification (interpretada como probabilidad).
- **ReLU**: Capas ocultas — es el estándar por su simplicidad y eficiencia.
- **Tanh**: Cuando se necesita salida centrada en cero; alternativa a ReLU en RNNs.
- **Softmax**: Capa de salida para clasificación multiclase (producing distribución de probabilidad).
- **Identidad**: Capa de salida para regresión.
- **Escalonada**: Solo educativa / perceptrón binario sin retropropagación.

## When NOT to Use

- **Sigmoide en capas ocultas profundas**: Vanishing gradient hace el entrenamiento lento o imposible.
- **ReLU sin monitoreo**: Puede causar dead neurons si el learning rate es muy alto.
- **Softmax en capas internas**: Generalmente solo se usa en la capa de salida de clasificación.

## Dependencies

- `lib.KafeMATH.functions` — `exp()` (exponencial), derivada del módulo matemático de KAFE.

## Related Concepts

- `dense-layer.md` — La capa Dense aplica funciones de activación post-transformación lineal.
- `loss-functions.md` — Las funciones de pérdida trabajan con las salidas de activación.
- `optimizers.md` — Los optimizadores usan las derivadas de activación para calcular gradientes.

## Relationship with KAFE

### Implementación en `ActivationFunction.py`

La clase abstracta `ActivationFunction` define el contrato:

```python
class ActivationFunction(ABC):
    def activate(self, x) → float     # σ(x)
    def derivative(self, x) → float   # σ'(x)
```

**Cada implementación almacena estado para backward eficiente**:

| Función | Estado almacenado | Beneficio |
|---|---|---|
| `Sigmoide` | `self.last_output` | Evita re-calcular $e^{-x}$ en derivada |
| `ReLU` | `self.last_input` | Permite distinguir $x > 0$ de $x \leq 0$ en derivada |
| `Tanh` | `self.last_output` | Reutiliza $\tanh(x)$ para calcular $1 - \tanh^2(x)$ |
| `Softmax` | `self.last_output` | Reutiliza vector de probabilidades |
| `Identidad` | — | No necesita estado (derivative = 1) |
| `Escalonada` | — | No necesita estado (derivative = 0) |

### Decisión de diseño: Derivada de Softmax como Jacobiana

La clase Softmax retorna la **matriz Jacobiana completa** en `derivative()`, no un vector. Esto es porque Softmax es una función vectorial: cada salida depende de todas las entradas. La capa Dense usa esta Jacobiana propagando el gradiente correctamente.

### Decisión de diseño: ReLU con $f'(0) = 0$

En $x = 0$, ReLU no está formalmente diferenciable. KafeGESHA usa la convención $f'(0) = 0$ (no $f'(0) = 1$). Esto es la implementación estándar en la mayoría de frameworks.

### Decisión de diseño: Softmax como caso especial en Dense

La capa Dense detecta `self.activation_name == "softmax"` y aplica `self.activation.activate(z)` sobre el vector completo, en lugar de elemento por elemento como con otras activaciones. Esto es necesario porque Softmax es colectiva.

## Usage Examples

```kafe
import gesha;

GESHA modelo = gesha.deep("classification");

-- ReLU en capas ocultas (el estándar)
modelo.add(gesha.dense(64, activation: "relu", input_shape: [10]));

-- Softmax en capa de salida (clasificación multiclase)
modelo.add(gesha.dense(5, activation: "softmax"));

-- Sigmoide para binary classification
GESHA binario = gesha.deep("binary");
binario.add(gesha.dense(1, activation: "sigmoid", input_shape: [8]));

-- Sin activación (regresión lineal)
GESHA reg = gesha.deep("regression");
reg.add(gesha.dense(1, input_shape: [3]));
```

## Implementation Location

- `src/lib/KafeGESHA/ActivationFunction.py` — clases `Sigmoide`, `ReLU`, `Tanh`, `Identidad`, `Escalonada`, `Softmax`
- `src/lib/KafeGESHA/ActivationFunctionLoader.py` — factory para cargar por nombre

## Public API

- Constructor por nombre: `"sigmoid"`, `"relu"`, `"tanh"`, `"softmax"`, `"identity"`, `"step"`
- Método: `activate(x)` → resultado de la función
- Método: `derivative(x)` → derivada en el punto

## References

- Nair, V., & Hinton, G. E. (2010). Rectified linear units improve restricted Boltzmann machines. ICML.
- Goodfellow, I., Bengio, Y., & Courville, A. (2016). Deep Learning, Chapter 6.2: Automatic Differentiation.
- Clevert, D., Unterthiner, T., & Hochreiter, S. (2015). Fast and accurate deep network learning by exponential linear units (ELUs). arXiv:1511.07289.
- Bishop, C. M. (2006). Pattern Recognition and Machine Learning, Chapter 5: Neural Networks. Springer.
