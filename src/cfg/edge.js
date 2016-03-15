import assert from "assert";
import Node from "./node";

export class Edge {
	constructor(from, branch, to) {
		assert (to, "branch cannot be null or undefined");
		assert (from instanceof Node && to instanceof Node, "from and to need to be an instance of Node");

		this.src = from;
		this.branch = branch;
		this.to = to;
	}
}

export default Edge;