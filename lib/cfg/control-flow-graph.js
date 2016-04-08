import assert from "assert";
import Node from "./node";
import Edge from "./edge";

/**
 * Possible Branches in a control flow graph
 * @type {{TRUE: string, FALSE: string, UNCONDITIONAL: string}}
 */
export const BRANCHES = {
	/**
	 * Branch that is only entered if the condition evaluates to true
	 */
	TRUE: "True",

	/**
	 * Branch that is only evaluated if the condition evaluates to false
	 */
	FALSE: "False",

	/**
	 * Branch that is always evaluated.
	 */
	UNCONDITIONAL: "Unconditional",

	/**
	 * Branch that is only evaluated in an exception case
	 */
	EXCEPTION: "Exception"
};

/**
 * Control flow graph that is based on directed edges between the nodes.
 */
export class ControlFlowGraph {
	/**
	 * Creates a new empty control flow graph
	 */
	constructor() {
		this._nodes = new Map();
	}

	/**
	 * Returns all nodes of this graph
	 * @returns {Iterator.<Node>} an iterator over all nodes.
     */
	getNodes() {
		return this._nodes.values();
	}

	/**
	 * Returns all the edges in the graph
	 * @returns {Iterator<Edge>} an iterator over all edges in the cfg
	 */
	* getEdges() {
		for (const node of this.getNodes()) {
			for (const successor of node.successors) {
				yield successor;
			}
		}
	}

	/**
	 * Returns the exit edges for the given node
	 * @param {Node} node for which CFG node the exit edges should be determined
	 * @returns {Iterator<Edge>} an iterator over all exit edges for the given node
	 */
	* getExitEdges(node) {
		const successorsToProcess = [node];
		const processedSuccessors = new Set();
		let current;

		while ((current = successorsToProcess.pop())) {
			processedSuccessors.add(current);
			for (const successor of current.successors) {
				if (successor.to.value === null) {
					yield successor;
				} else if (!processedSuccessors.has(successor.to)) {
					successorsToProcess.unshift(successor.to);
				}
			}
		}
	}

	/**
	 * Returns the existing node for the given value or undefined if no node for the given value exists.
	 * @param value the value for which the node should be resolved
	 * @returns {Node} the node that wraps the value or undefined if no node for the given value exists.
     */
	getNode(value) {
		return this._nodes.get(value);
	}

	/**
	 * Creates a new node for the given value or returns the existing node for the given value.
	 * @param value the value that should be added to the graph
	 * @returns {!Node} the created or existing node
     */
	createNode(value) {
		const existing = this._nodes.get(value);
		if (existing) {
			return existing;
		}

		const graphNode = new Node(value);
		this._nodes.set(value, graphNode);

		return graphNode;
	}

	/**
	 * Creates a connection between the from and to value. If from or to are a value and no node exists
	 * for the given value, then a new node is created.
	 * @param {Node|*} from the node from which the directed connection should be created or the value
	 * @param branch the label that should be added to the edge
     * @param {Node|*} to the node to which the directed connection should be created or the value.
     */
	connectIfNotFound(from, branch, to) {
		const fromGraphNode = this._getNodeFromValueOrNode(from);
		const toGraphNode = this._getNodeFromValueOrNode(to);

		if (!this.isConnected(fromGraphNode, toGraphNode, branch)) {
			const edge = new Edge(fromGraphNode, branch, toGraphNode);
			fromGraphNode.successors.add(edge);
			toGraphNode.predecessors.add(edge);
		}
	}

	/**
	 * Indicator if a connection from the 'from' value to the 'to' value exists (if to is a successor of to) for the given branch.
	 * @param {Node|*} from the from value or node
	 * @param {Node|*} to the to value or node
	 * @param [branch] the required label between the from and to node. If absent, then the branch label is not checked.
     * @returns {boolean} true if an edge from the 'from' value to the 'to' value exists (with the given branch, if present)
     */
	isConnected(from, to, branch) {
		const fromGraphNode = this._getNodeFromValueOrNode(from);
		const toGraphNode = this._getNodeFromValueOrNode(to);

		return toGraphNode.isSuccessorOf(fromGraphNode, branch);
	}

	_getNodeFromValueOrNode(valueOrGraphNode) {
		if (valueOrGraphNode instanceof Node) {
			return valueOrGraphNode;
		}
		const graphNode = this.createNode(valueOrGraphNode);

		assert(graphNode, "The node for the given value node doesn't exist");
		return graphNode;
	}
}



export default ControlFlowGraph;