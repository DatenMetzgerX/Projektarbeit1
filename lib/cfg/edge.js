import assert from "assert";
import Node from "./node";

/**
 * Represents a directed edge between to nodes in the control flow graph
 */
export class Edge {
	/**
	 * Creates a new edge
	 * @param {!Node} from the source node of the edge
	 * @param branch label for the edge, what kind of branch is it
     * @param {!Node} to end of the edge
     */
	constructor(from, branch, to) {
		assert (to, "branch cannot be null or undefined");
		assert (from instanceof Node && to instanceof Node, "from and to need to be an instance of Node");

		/**
		 * The from / source node from which this edge points to the `to` node
		 * @type {Node}
         */
		this.src = from;

		/**
		 * Label for this edge
		 */
		this.branch = branch;

		/**
		 * The to end of this branch (target)
		 * @type {Node}
         */
		this.to = to;
	}
}

export default Edge;