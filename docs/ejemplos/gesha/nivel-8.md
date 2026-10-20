# Nivel 8 · MNIST

KafeKAGGLE lee imágenes JPG de 28×28 en escala de grises y devuelve píxeles en `[0,1]`. El programa aplana cada imagen a 784 entradas. Este dataset también trae 600 imágenes duplicadas en la raíz de `trainingSample` sin etiqueta; el ejemplo selecciona únicamente carpetas `0` a `9`. Para mantener el tiempo de ejecución razonable usa dos imágenes por dígito y una época, con una imagen de cada clase para entrenamiento y otra para prueba. Es una comprobación funcional de la arquitectura: la accuracy puede ser baja y no estima su potencial. Amplía el muestreo y las épocas para entrenar un clasificador más serio.

```kafe
--8<-- "docs/ejemplos/gesha-nivel-8-mnist.kf"
```

[Descargar programa KAFE](../gesha-nivel-8-mnist.kf) · [Volver a los ocho niveles](../gesha-niveles.md)
