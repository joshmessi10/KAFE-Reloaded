"""Functional Model — layered DAG graph.

The Functional API allows you to define models as directed acyclic graphs (DAGs),
enabling non-linear architectures such as skip-connections and multiple outputs.

Basic usage (linear graph):

    inputs = Input(shape=(784,))
    x = Dense(128)(inputs)
    x = ReLULayer()(x)
    x = Dense(64)(x)
    outputs = Dense(10)(x)
    model = Functional(inputs=inputs, outputs=outputs)

Usage with skip-connection (two branches + merge):

    inputs = Input(shape=(64,))
    branch_a = Dense(32)(inputs)
    branch_a = ReLULayer()(branch_a)
    branch_b = Dense(32)(inputs)
    branch_b = ReLULayer()(branch_b)
    merged = Add())([branch_a, branch_b]) # merge layer
    outputs = Dense(10)(merged)
    model = Functional(inputs=inputs, outputs=outputs)

Internally the model:
1. Traverse the graph from output to input (inverse BFS).
2. Build the correct topological order.
3. In forward: it goes through in topological order, caching outputs per node.
4. In backward: runs in reverse order, propagating gradients.
"""
from lib.KafeGESHA.core.model import Model
from lib.KafeGESHA.core.node import Node, InputNode
from lib.KafeGESHA.layers.input_layer import Input


class Add:
    """Merge layer that sums element-wise the outputs of multiple branches.

    Used in the Functional API to combine two or more branches:

        merged = Add().connect([branch_a, branch_b])

    In backward it distributes the gradient to all input branches
    (the gradient of the sum is 1 for each branch).
    """

    def __init__(self):
        self.name = "Add"
        self._training = True
        self._last_inputs = None
        self._output_node = None

    def connect(self, input_nodes):
        """Create an Add node with multiple entries.

        Args:
            input_nodes: List of symbolic Nodes to add.

        Returns:
            Symbolic output node.
        """
        if not isinstance(input_nodes, list):
            input_nodes = [input_nodes]
        output_node = Node(layer=self, inbound_nodes=input_nodes)
        self._output_node = output_node
        return output_node

    def forward(self, inputs):
        """inputs: list of vectors to add element-wise."""
        self._last_inputs = [v[:] for v in inputs]
        n = len(inputs[0])
        result = [sum(inp[i] for inp in inputs) for i in range(n)]
        return result

    def backward(self, output_error, learning_rate, regularization_lambda=None):
        """Distributes the gradient to all branches (sum gradient = 1)."""
        if not isinstance(output_error, list):
            output_error = [output_error]
        # Returns the same gradient for each input branch
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
    """Model based on layered DAG graph.

    Supports:
    - Linear graphs (equivalent to Sequential).
    - Simple skip connections (2 branches + Add).
    - Multiple entrances and exits (prepared structure).

    Internally builds the topology using topological sort (BFS
    from the output nodes to the input nodes).

    Attributes:
        _input_nodes: List of InputNodes of the graph.
        _output_nodes: Graph output Node list.
        _exec_order: List of Nodes in topological order of execution.
    """

    def __init__(self, inputs=None, outputs=None):
        """Initializes the Functional model.

        Args:
            inputs: Symbolic input or Input list.
            outputs: Output symbolic Node or Node list.
        """
        super().__init__()

        # Normalize to lists
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

        # Get InputNodes from Input objects
        self._input_nodes = [inp.node for inp in self._inputs]

        # Build execution order
        self._exec_order = self._topological_sort()

    # ------------------------------------------------------------------
    # Graph building
    # ------------------------------------------------------------------

    def _topological_sort(self):
        """Build the topological order of the graph (Kahn's algorithm).

        Walk from the exit nodes to the entry nodes
        building the list of dependencies, then ordering
        that each node appears after all its inbound_nodes.

        Returns:
            List of Nodes in order of execution (input → output).
        """
        # Collect all nodes in the graph using BFS from outputs
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

        # Build in-degrees map for Kahn's algorithm
        in_degree = {id(n): 0 for n in all_nodes}
        children = {id(n): [] for n in all_nodes}
        node_by_id = {id(n): n for n in all_nodes}

        for node in all_nodes:
            for inbound in node.inbound_nodes:
                if id(inbound) in in_degree:
                    in_degree[id(node)] += 1
                    children[id(inbound)].append(id(node))

        # Kahn's algorithm: process nodes with in-degree 0 first
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
    # Abstract Model interface
    # ------------------------------------------------------------------

    def forward(self, x):
        """Forward propagation traversing the graph in topological order.

        Args:
            x: Model input (vector or list of vectors for multi-input).

        Returns:
            Model output (output node vector).
        """
        # Clear caches
        for node in self._exec_order:
            node.clear_cache()

        # Assign input(s) to InputNodes
        if isinstance(x, list) and self._input_nodes and isinstance(x[0], list):
            # Multiple inputs
            for inp_node, xi in zip(self._input_nodes, x):
                inp_node._output_cache = xi
        else:
            # A single input
            if self._input_nodes:
                self._input_nodes[0]._output_cache = x

        # Run in topological order
        for node in self._exec_order:
            if isinstance(node, InputNode):
                continue  # _output_cache is already assigned

            layer = node.layer
            inbound = node.inbound_nodes

            if layer is None:
                continue

            # Collect inputs from previous nodes
            if isinstance(layer, Add):
                # Merge layer: list of branch outputs
                inputs_list = [ib._output_cache for ib in inbound]
                node._output_cache = layer.forward(inputs_list)
            elif len(inbound) == 1:
                node._output_cache = layer.forward(inbound[0]._output_cache)
            else:
                # Generic multi-input: concatenate (for future extension)
                combined = []
                for ib in inbound:
                    combined.extend(ib._output_cache)
                node._output_cache = layer.forward(combined)

        # Exit from the last exit node
        if len(self._output_nodes) == 1:
            return self._output_nodes[0]._output_cache
        return [n._output_cache for n in self._output_nodes]

    def backward(self, grad):
        """Backward propagation in reverse topological order.

        Distribute the gradients throughout the graph. For nodes with multiple
        outputs (skip connections), accumulate their gradients.

        Args:
            grad: Gradient of the loss with respect to the model output.
        """
        if not isinstance(grad, list):
            grad = [grad]

        # Map node ID to accumulated gradient
        grad_map = {}

        # Initialize gradients at output nodes
        if len(self._output_nodes) == 1:
            grad_map[id(self._output_nodes[0])] = grad
        else:
            for out_node, g in zip(self._output_nodes, grad):
                grad_map[id(out_node)] = g if isinstance(g, list) else [g]

        lr = self._optimizer_obj.lr

        # Go through in reverse order
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
                # Add distributes the gradient to each branch
                branch_grads = layer.backward(node_grad, learning_rate=lr)
                for ib, bg in zip(inbound, branch_grads):
                    ib_id = id(ib)
                    if ib_id in grad_map:
                        # Accumulate (for nodes with multiple consumers)
                        grad_map[ib_id] = [
                            grad_map[ib_id][i] + bg[i]
                            for i in range(len(bg))
                        ]
                    else:
                        grad_map[ib_id] = bg
            else:
                # Standard layer
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
        """Returns a flat list of all trainable parameters."""
        params = []
        seen = set()
        for node in self._exec_order:
            if node.layer is not None and id(node.layer) not in seen:
                seen.add(id(node.layer))
                params.extend(node.layer.parameters())
        return params

    def get_layers(self):
        """Returns the layers in topological order (no duplicates)."""
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
        """Prints the summary of the Functional network."""
        print("=== Functional ===")
        for i, node in enumerate(self._exec_order, 1):
            if isinstance(node, InputNode):
                print(f"  [{i}] Input(shape={node.shape})")
            elif node.layer is not None:
                print(f"  [{i}] ", end="")
                node.layer.summary()
        total = len(self.parameters())
        print(f"  Total parameters: {total}")
        print("==================")

    def __repr__(self):
        n_layers = len(self.get_layers())
        return f"Functional(layers={n_layers}, inputs={len(self._inputs)}, outputs={len(self._output_nodes)})"