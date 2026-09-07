# Gradient Descent Optimizers (Optimizadores de Descenso de Gradiente)

## Category

Deep Learning — Componente de red neuronal

## Description

Los optimizadores determinan **cómo** se actualizan los pesos de la red neuronal basándose en los gradientes calculados por la retropropagación. Un buen optimizador puede significar la diferencia entre un modelo que converge y uno que diverge o se atasca en mínimos locales subóptimos.

KafeGESHA implementa 4 optimizadores desde cero, progresando en sofisticación:

| Optimizer | Tipo | Fórmula de actualización |
|---|---|---|
| SGD | Gradiente descendente básico | $\theta \leftarrow \theta - \eta \cdot g$ |
| RMSprop | Tasa adaptativa | $\theta \leftarrow \theta - \eta \cdot \frac{g}{\sqrt{v} + \epsilon}$ |
| Adam | Momentum + tasa adaptativa | $\theta \leftarrow \theta - \eta \cdot \frac{\hat{m}}{\sqrt{\hat{v}} + \epsilon}$ |
| AdamW | Adam + weight decay | $\theta \leftarrow \theta - \eta \cdot \frac{\hat{m}}{\sqrt{\hat{v}} + \epsilon} - \eta \lambda \theta$ |

## Mathematical Foundation

### SGD (Stochastic Gradient Descent)

El optimizador más simple. Actualiza cada parámetro en la dirección opuesta al gradiente:

$$\theta_{t+1} = \theta_t - \eta \cdot g_t$$

Donde:
- $\theta_t$ es el parámetro en el paso $t$
- $\eta$ es la tasa de aprendizaje (learning rate)
- $g_t = \frac{\partial L}{\partial \theta}$ es el gradiente

**Propiedades**:
- Simple, eficiente, determinista (sin memoria adicional)
- Sensible a la tasa de aprendizaje: demasiado grande → diverge; demasiado pequeña → lento
- Oscila en direcciones de alta curvatura
- Puede atascarse en mínimos locales o saddle points

### RMSprop (Root Mean Square Propagation)

Mantiene una media móvil exponencial de los gradientes al cuadrado para adaptar la tasa de aprendizaje por parámetro:

$$v_t = \rho \cdot v_{t-1} + (1 - \rho) \cdot g_t^2$$

$$\theta_{t+1} = \theta_t - \eta \cdot \frac{g_t}{\sqrt{v_t} + \epsilon}$$

Donde:
- $v_t$ es el "cache" (promedio móvil de $g^2$)
- $\rho$ es el factor de decaimiento (típicamente 0.9)
- $\epsilon$ previene división por cero (típicamente $10^{-8}$)

**Intuición**: Si un parámetro tiene gradientes consistentemente grandes, $v_t$ crece, y la actualización se hace más pequeña. Si los gradientes son pequeños y variables, $v_t$ es pequeño, y la actualización se hace más grande.

**Propiedades**:
- Adapta la tasa de aprendizaje por dimensión
- Funciona bien en problemas con curvaturas diferentes por dimensión
- Requiere un hiperparámetro adicional ($\rho$)

### Adam (Adaptive Moment Estimation)

Combina las ideas de **momentum** (promedio móvil de gradientes) y **RMSprop** (promedio móvil de gradientes al cuadrado):

**Primer momento** (media móvil de gradientes — momentum):
$$m_t = \beta_1 \cdot m_{t-1} + (1 - \beta_1) \cdot g_t$$

**Segundo momento** (media móvil de $g^2$ — adaptativo):
$$v_t = \beta_2 \cdot v_{t-1} + (1 - \beta_2) \cdot g_t^2$$

**Corrección de sesgo** (por inicializar en ceros):
$$\hat{m}_t = \frac{m_t}{1 - \beta_1^t}, \quad \hat{v}_t = \frac{v_t}{1 - \beta_2^t}$$

**Actualización**:
$$\theta_{t+1} = \theta_t - \eta \cdot \frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon}$$

**Hiperparámetros típicos**: $\beta_1 = 0.9$, $\beta_2 = 0.999$, $\epsilon = 10^{-8}$

**Propiedades**:
- El optimizador más popular para deep learning
- Combina las ventajas de momentum y adaptación
- Las correcciones de sesgo compensan la inicialización en ceros de $m_0$ y $v_0$
- Robusto a la elección de learning rate (relativamente)

### AdamW (Adam with Weight Decay)

Adam estándar con **weight decay** explícito (decoupled del gradient update):

$$\theta_{t+1} = \theta_t - \eta \cdot \frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon} - \eta \cdot \lambda \cdot \theta_t$$

Donde $\lambda$ es el coeficiente de weight decay.

**Diferencia con L2 regularization**:
- L2 agrega $\lambda \cdot \theta$ al gradiente: $g' = g + \lambda \cdot \theta$. Esto se ve afectado por la adaptación de Adam.
- AdamW aplica weight decay **después** de la actualización de Adam, sin escalar por $\sqrt{\hat{v}_t}$. Esto es más efectivo para regularización.

**Propiedades**:
- Generalmente supera a Adam en tareas de generalización
- El weight decay actúa como regularización implícita
- Más estable en entrenamientos largos

## Step-by-Step Algorithm

### SGD

1. Recibir parámetros $\theta$ y gradientes $g$.
2. Para cada parámetro $i$: $\theta_i \leftarrow \theta_i - \eta \cdot g_i$.
3. Retornar nuevos parámetros.

### RMSprop

4. Inicializar cache $v = 0$ si es la primera vez.
5. Para cada parámetro $i$:
   a. Actualizar cache: $v_i \leftarrow \rho \cdot v_i + (1 - \rho) \cdot g_i^2$.
   b. Calcular actualización: $\Delta_i = \eta \cdot \frac{g_i}{\sqrt{v_i} + \epsilon}$.
   c. Actualizar: $\theta_i \leftarrow \theta_i - \Delta_i$.
6. Retornar nuevos parámetros.

### Adam

7. Inicializar momentos $m = 0$, $v = 0$, contador $t = 0$ si es la primera vez.
8. Incrementar $t \leftarrow t + 1$.
9. Para cada parámetro $i$:
   a. Actualizar primer momento: $m_i \leftarrow \beta_1 \cdot m_i + (1 - \beta_1) \cdot g_i$.
   b. Actualizar segundo momento: $v_i \leftarrow \beta_2 \cdot v_i + (1 - \beta_2) \cdot g_i^2$.
   c. Corregir sesgo: $\hat{m}_i = \frac{m_i}{1 - \beta_1^t}$, $\hat{v}_i = \frac{v_i}{1 - \beta_2^t}$.
   d. Calcular actualización: $\Delta_i = \eta \cdot \frac{\hat{m}_i}{\sqrt{\hat{v}_i} + \epsilon}$.
   e. Actualizar: $\theta_i \leftarrow \theta_i - \Delta_i$.
10. Retornar nuevos parámetros.

### AdamW

11. Ejecutar pasos 7-10 de Adam → obtener $\theta_{\text{adam}}$.
12. Para cada parámetro $i$:
    a. Aplicar weight decay: $\theta_i \leftarrow \theta_{\text{adam}, i} - \eta \cdot \lambda \cdot \theta_{\text{adam}, i}$.
13. Retornar nuevos parámetros.

## Motivation

Sin optimizadores sofisticados, las redes neuronales profundas son extremadamente difíciles de entrenar. SGD puro oscila y converge lentamente. RMSprop y Adam resuelven esto adaptando la tasa de aprendizaje por parámetro, making el entrenamiento más robusto y rápido. AdamW mejora la generalización al aplicar weight decay correctamente. KafeGESHA implementa cada uno desde cero para que el estudiante vea exactamente qué estado mantiene cada optimizador y por qué las correcciones de sesgo son necesarias.

## Advantages

- **Progresión educativa**: Los 4 optimizadores muestran una evolución clara: SGD → RMSprop → Adam → AdamW.
- **Estado interno explícito**: Cada optimizador almacena su estado ($m$, $v$, cache) como atributos, making visible lo que otros frameworks ocultan.
- **Corrección de sesgo en Adam**: Implementada correctamente, previene la inicialización lenta en los primeros pasos.
- **Weight decay decoupled**: AdamW aplica weight decay correctamente, no como regularización L2.

## Limitations

- **SGD sin momentum**: Oscila en direcciones de alta curvatura; sin momentum, converge lentamente.
- **Hiperparámetros**: RMSprop, Adam y AdamW requieren ajustar $\rho/\beta$, $\epsilon$, y learning rate.
- **Memoria**: Adam y AdamW mantienen 2 momentos por parámetro (duplica la memoria vs SGD).
- **Adam puede generalizar peor que SGD**: En algunos problemas, SGD con momentum generaliza mejor que Adam.

## When to Use

- **SGD**: Problemas simples, prototipado rápido, cuando se quiere entender el efecto del learning rate.
- **RMSprop**: RNNs, problemas con gradientes de magnitudes muy diferentes por dimensión.
- **Adam**: El estándar para la mayoría de problemas de deep learning; buen punto de partida.
- **AdamW**: Cuando se necesita regularización efectiva (modelos grandes, poca data).

## When NOT to Use

- **SGD para redes profundas**: Sin momentum, el entrenamiento puede ser prohibitivamente lento.
- **Adam para problemas convexos simples**: Puede ser sobre-ingeniería; SGD con learning rate decay suele ser suficiente.
- **AdamW sin weight decay**: Si $\lambda = 0$, es idéntico a Adam.

## Dependencies

- `lib.KafeMATH.funciones` — `pow_()` (potencia), `sqrt()` (raíz cuadrada).

## Related Concepts

- `dense-layer.md` — Las capas Dense aplican las actualizaciones de pesos producidas por optimizadores.
- `loss-functions.md` — Las funciones de pérdida generan los gradientes que optimizadores consumen.
- `activation-functions.md` — Las derivadas de activación contribuyen a los gradientes.

## Relationship with KAFE

### Implementación en `Optimizer.py`

La clase abstracta `Optimizer` define:

```python
class Optimizer:
    def step(self, params, grads) → list  # Retorna nuevos parámetros
```

**Estado de cada optimizador**:

| Optimizer | Estado | Descripción |
|---|---|---|
| `SGD` | — | Sin memoria (estadoless) |
| `RMSprop` | `self.cache` | Media móvil de $g^2$ por parámetro |
| `Adam` | `self.m`, `self.v`, `self.t$ | Primer momento, segundo momento, contador de pasos |
| `AdamW` | Hereda de Adam + `self.weight_decay` | Weight decay $\lambda$ |

### Decisión de diseño: Optimizers no mutan parámetros in-place

Los optimizadores en KafeGESHA **retornan** nuevos parámetros en lugar de modificar los existentes. Esto es más seguro y educativo (el estudiante puede inspeccionar antes y después). Sin embargo, la capa Dense sí muta sus pesos internos en `backward()` usando `learning_rate` directamente.

### Decisión de diseño: `step()` recibe vectores planos

Los optimizadores operan sobre listas planas de parámetros y gradientes, no sobre matrices. Esto simplifica la implementación pero significa que la capa Dense debe "aplanar" sus pesos si quisiera usar optimizadores externos. Actualmente, Dense aplica SGD internamente en `backward()`.

### Decisión de diseño: AdamW hereda de Adam

`AdamW` extiende `Adam` y agrega weight decay después de la actualización de Adam. Esto es correcto: el weight decay se aplica **después** de la corrección de momentum, no antes. La diferencia es sutil pero importante para la efectividad de la regularización.

### Integración con GeshaDeep

En `GeshaDeep.compile()`, se mapean strings a objetos optimizer:

```python
"sgd" → SGD(lr=0.01)
"rmsprop" → RMSprop(lr=0.001)
"adam" → Adam(lr=0.001)
"adamw" → AdamW(lr=0.001)
```

El learning rate se puede ajustar posteriormente con `set_lr(new_lr)`.

## Usage Examples

```kafe
import gesha;

GESHA modelo = gesha.deep("classification");
modelo.add(gesha.dense(32, activation: "relu", input_shape: [4]));
modelo.add(gesha.dense(3, activation: "softmax"));

-- SGD: el más simple, good para educación
modelo.compile(optimizer: "sgd", loss: "categorical_crossentropy");

-- Adam: el estándar, buen default
modelo.compile(optimizer: "adam", loss: "categorical_crossentropy");

-- AdamW: con regularización implícita
modelo.compile(optimizer: "adamw", loss: "categorical_crossentropy");

-- Ajustar learning rate dinámicamente
modelo.set_lr(0.0001);
```

## Implementation Location

- `src/lib/KafeGESHA/Optimizer.py` — clases `SGD`, `RMSprop`, `Adam`, `AdamW`
- `src/lib/KafeGESHA/GeshaDeep.py` — mapeo de strings a optimizers en `compile()` y `set_lr()`

## Public API

- Nombres en `compile()`: `"sgd"`, `"rmsprop"`, `"adam"`, `"adamw"`
- Método: `step(params, grads)` → nuevos parámetros
- Método (en GeshaDeep): `set_lr(new_lr)` → ajusta learning rate

## References

- Robbins, H., & Monro, S. (1951). A stochastic approximation method. The Annals of Mathematical Statistics, 22(3), 400-407.
- Hinton, G. (2012). Lecture 6a: Overview of mini-batch gradient descent. Coursera/Neural Networks.
- Kingma, D. P., & Ba, J. (2014). Adam: A method for stochastic optimization. arXiv:1412.6980.
- Loshchilov, I., & Hutter, F. (2017). Decoupled weight decay regularization. arXiv:1711.05101.
- Ruder, S. (2016). An overview of gradient descent optimization algorithms. arXiv:1609.04747.
