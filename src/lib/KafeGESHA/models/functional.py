"""Modelo Functional — grafo DAG de capas.

La API Functional permite definir modelos como grafos dirigidos acíclicos (DAG),
habilitando arquitecturas no lineales como skip-connections y múltiples salidas.

Uso básico (grafo lineal):

    inputs = Input(shape=(784,))
    x = Dense(128)(inputs)
    x = ReLULayer()(x)
    x = Dense(64)(x)
    outputs = Dense(10)(x)
    model = Functional(inputs=inputs, outputs=outputs)

Uso con skip-connection (dos ramas + merge):

    inputs = Input(shape=(64,))
    branch_a = Dense(32)(inputs)
    branch_a = ReLULayer()(branch_a)
    branch_b = Dense(32)(inputs)
    branch_b = ReLULayer()(branch_b)
    merged = Add()([branch_a, branch_b])   # capa de merge
    outputs = Dense(10)(merged)
    model = Functional(inputs=inputs, outputs=outputs)

Internamente el modelo:
1. Recorre el grafo desde output hacia input (BFS inverso).
2. Construye el orden topológico correcto.
3. En forward: recorre en orden topológico, cacheando salidas por nodo.
4. En backward: recorre en orden inverso, propagando gradientes.
"""
from lib.KafeGESHA.core.model import Model
from lib.KafeGESHA.core.node import Node, InputNode
from lib.KafeGESHA.layers.input_layer import Input


class Add:
    """Capa de merge que suma element-wise las salidas de múltiples ramas.

    Usada en la API Functional para combinar dos o más ramas:

        merged = Add().connect([branch_a, branch_b])

    En backward distribuye el gradiente a todas las ramas de entrada
    (el gradiente de la suma es 1 para cada rama).
    """

    def __init__(self):
        self.name = "Add"
        self._training = True
        self._last_inputs = None
        self._output_node = None

    def connect(self, input_nodes):
        """Crea un nodo Add con múltiples entradas.

        Args:
            input_nodes: Lista de Node simbólicos a sumar.

        Returns:
            Node simbólico de salida.
        """
        if not isinstance(input_nodes, list):
            input_nodes = [input_nodes]
        output_node = Node(layer=self, inbound_nodes=input_nodes)
        self._output_node = output_node
        return output_node

    def forward(self, inputs):
        """inputs: lista de vectores a sumar element-wise."""
        self._last_inputs = [v[:] for v in inputs]
        n = len(inputs[0])
        result = [sum(inp[i] for inp in inputs) for i in range(n)]
        return result

    def backward(self, output_error, learning_rate, regularization_lambda=None):
        """Distribuye el gradiente a todas las ramas (gradiente de la suma = 1)."""
        if not isinstance(output_error, list):
            output_error = [output_error]
        # Devuelve el mismo gradiente para cada rama de entrada
        n_inputs = len(self._last_inputs) if self._last_inputs else 1
        return [output_error[:] for _ in range(n_inputs)]

    def parameters(self):
        return []

    def train(self):
        self._training = True

    def eval(self):
        self._training = False

    def summary(self):
        print("Add()")


class Functional(Model):
    """Modelo basado en grafo DAG de capas.

    Soporta:
    - Grafos lineales (equivalente a Sequential).
    - Skip-connections simples (2 ramas + Add).
    - Múltiples entradas y salidas (estructura preparada).

    Internamente construye la topología mediante topological sort (BFS
    desde los nodos de salida hacia los de entrada).

    Attributes:
        _input_nodes: Lista de InputNode del grafo.
        _output_nodes: Lista de Node de salida del grafo.
        _exec_order: Lista de Node en orden topológico de ejecución.
    """

    def __init__(self, inputs=None, outputs=None):
        """Inicializa el modelo Functional.

        Args:
            inputs: Input simbólico o lista de Input.
            outputs: Node simbólico de salida o lista de Node.
        """
        super().__init__()

        # Normalizar a listas
        if isinstance(inputs, Input):
            self._inputs = [inputs]
        elif isinstance(inputs, list):
            self._inputs = inputs
        else:
            self._inputs = []

        if isinstance(outputs, Node):
            self._output_nodes = [outputs]
        elif isinstance(outputs, list):
            self._output_nodes = outputs
        else:
            self._output_nodes = []

        # Obtener InputNodes desde los objetos Input
        self._input_nodes = [inp.node for inp in self._inputs]

        # Construir orden de ejecución
        self._exec_order = self._topological_sort()

    # ------------------------------------------------------------------
    # Graph building
    # ------------------------------------------------------------------

    def _topological_sort(self):
        """Construye el orden topológico del grafo (Kahn's algorithm).

        Recorre desde los nodos de salida hacia los nodos de entrada
        construyendo la lista de dependencias, luego ordena de forma
        que cada nodo aparece después de todos sus inbound_nodes.

        Returns:
            Lista de Node en orden de ejecución (input → output).
        """
        # Recopilar todos los nodos del grafo mediante BFS desde outputs
        visited = set()
        all_nodes = []
        queue = list(self._output_nodes)

        while queue:
            node = queue.pop(0)
            node_id = id(node)
            if node_id in visited:
                continue
            visited.add(node_id)
            all_nodes.append(node)
            for inbound in node.inbound_nodes:
                if id(inbound) not in visited:
                    queue.append(inbound)

        # Construir mapa de in-degrees para Kahn's algorithm
        in_degree = {id(n): 0 for n in all_nodes}
        children = {id(n): [] for n in all_nodes}
        node_by_id = {id(n): n for n in all_nodes}

        for node in all_nodes:
            for inbound in node.inbound_nodes:
                if id(inbound) in in_degree:
                    in_degree[id(node)] += 1
                    children[id(inbound)].append(id(node))

        # Kahn's algorithm: procesar nodos con in-degree 0 primero
        zero_q = [nid for nid, deg in in_degree.items() if deg == 0]
        topo_order = []

        while zero_q:
            nid = zero_q.pop(0)
            topo_order.append(node_by_id[nid])
            for child_id in children[nid]:
                in_degree[child_id] -= 1
                if in_degree[child_id] == 0:
                    zero_q.append(child_id)

        return topo_order

    # ------------------------------------------------------------------
    # Interfaz abstracta Model
    # ------------------------------------------------------------------

    def forward(self, x):
        """Propagación hacia adelante recorriendo el grafo en orden topológico.

        Args:
            x: Entrada del modelo (vector o lista de vectores para multi-input).

        Returns:
            Salida del modelo (vector del nodo de salida).
        """
        # Limpiar cachés
        for node in self._exec_order:
            node.clear_cache()

        # Asignar entrada(s) a los InputNodes
        if isinstance(x, list) and self._input_nodes and isinstance(x[0], list):
            # Múltiples inputs
            for inp_node, xi in zip(self._input_nodes, x):
                inp_node._output_cache = xi
        else:
            # Un solo input
            if self._input_nodes:
                self._input_nodes[0]._output_cache = x

        # Ejecutar en orden topológico
        for node in self._exec_order:
            if isinstance(node, InputNode):
                continue  # ya tiene _output_cache asignado

            layer = node.layer
            inbound = node.inbound_nodes

            if layer is None:
                continue

            # Recoger inputs desde los nodos anteriores
            if isinstance(layer, Add):
                # Capa de merge: pasa lista de salidas de las ramas
                inputs_list = [ib._output_cache for ib in inbound]
                node._output_cache = layer.forward(inputs_list)
            elif len(inbound) == 1:
                node._output_cache = layer.forward(inbound[0]._output_cache)
            else:
                # Multi-input genérico: concatenar (para extensión futura)
                combined = []
                for ib in inbound:
                    combined.extend(ib._output_cache)
                node._output_cache = layer.forward(combined)

        # Salida del último nodo de salida
        if len(self._output_nodes) == 1:
            return self._output_nodes[0]._output_cache
        return [n._output_cache for n in self._output_nodes]

    def backward(self, grad):
        """Propagación hacia atrás en orden topológico inverso.

        Distribuye los gradientes por el grafo. Para nodos con múltiples
        salidas (skip-connections), acumula gradientes.

        Args:
            grad: Gradiente de la loss respecto a la salida del modelo.
        """
        if not isinstance(grad, list):
            grad = [grad]

        # Mapa nodo_id → gradiente acumulado
        grad_map = {}

        # Inicializar gradientes en los nodos de salida
        if len(self._output_nodes) == 1:
            grad_map[id(self._output_nodes[0])] = grad
        else:
            for out_node, g in zip(self._output_nodes, grad):
                grad_map[id(out_node)] = g if isinstance(g, list) else [g]

        lr = self._optimizer_obj.lr

        # Recorrer en orden inverso
        for node in reversed(self._exec_order):
            if isinstance(node, InputNode) or node.layer is None:
                continue

            node_id = id(node)
            if node_id not in grad_map:
                continue

            node_grad = grad_map[node_id]
            layer = node.layer
            inbound = node.inbound_nodes

            if isinstance(layer, Add):
                # Add distribuye el gradiente a cada rama
                branch_grads = layer.backward(node_grad, learning_rate=lr)
                for ib, bg in zip(inbound, branch_grads):
                    ib_id = id(ib)
                    if ib_id in grad_map:
                        # Acumular (para nodos con múltiples consumidores)
                        grad_map[ib_id] = [
                            grad_map[ib_id][i] + bg[i]
                            for i in range(len(bg))
                        ]
                    else:
                        grad_map[ib_id] = bg
            else:
                # Capa estándar
                in_grad = layer.backward(node_grad, learning_rate=lr)
                for ib in inbound:
                    ib_id = id(ib)
                    if ib_id in grad_map:
                        grad_map[ib_id] = [
                            grad_map[ib_id][i] + in_grad[i]
                            for i in range(len(in_grad))
                        ]
                    else:
                        grad_map[ib_id] = in_grad

        return grad_map

    def parameters(self):
        """Devuelve lista plana de todos los parámetros entrenables."""
        params = []
        seen = set()
        for node in self._exec_order:
            if node.layer is not None and id(node.layer) not in seen:
                seen.add(id(node.layer))
                params.extend(node.layer.parameters())
        return params

    def get_layers(self):
        """Devuelve las capas en orden topológico (sin duplicados)."""
        layers = []
        seen = set()
        for node in self._exec_order:
            if node.layer is not None and id(node.layer) not in seen:
                seen.add(id(node.layer))
                layers.append(node.layer)
        return layers

    # ------------------------------------------------------------------
    # summary
    # ------------------------------------------------------------------

    def summary(self):
        """Imprime el resumen del grafo Functional."""
        print("=== Functional ===")
        for i, node in enumerate(self._exec_order, 1):
            if isinstance(node, InputNode):
                print(f"  [{i}] Input(shape={node.shape})")
            elif node.layer is not None:
                print(f"  [{i}] ", end="")
                node.layer.summary()
        total = len(self.parameters())
        print(f"  Parámetros totales: {total}")
        print("==================")

    def __repr__(self):
        n_layers = len(self.get_layers())
        return f"Functional(layers={n_layers}, inputs={len(self._inputs)}, outputs={len(self._output_nodes)})"