/**
 * A node inside the control flow graph. Each node wraps a value (in case of the CFG a AST-Node)
 * and knows it's successor and predecessor nodes for a forward or backward data flow analysis.
 * A node can have an optional annotation that stores an arbitrary value, e.g. for a data flow analysis.
 */
export class Node {
	/**
	 * Creates a new node that wraps the passed in value
	 * @param value the value associated with this node
     */
	constructor(value) {
		/**
		 * The value associated with this node
		 * @type {*}
		 */
		this.value = value;

		/**
		 * The set with the successor nodes
		 * @type {Set<Node>}
         */
		this.successors = new Set();

		/**
		 * The set with the predecessor nodes
		 * @type {Set<Node>}
         */
		this.predecessors = new Set();

		/**
		 * Optional annotation for this node
		 * @type {*}
         */
		this.annotation = null;
	}

	/**
	 * Indicator if this node is a successor of the passed in node with the given branch
	 * @param {Node} node the node of which this node should be a successor of
	 * @param [branch] the kind of branch between the two nodes.
	 * @returns {boolean} returns true if this node is a successor of the given node with the defined branch type.
	 * If the branch value is absent, then true is returned if any edge between the passed in node to this node exist.
     */
	isSuccessorOf(node, branch) {
		for (const edge of node.successors) {
			if (edge.to === this && (!branch || branch === edge.branch)) {
				return true;
			}
		}

		return false;
	}
}

export default Node;