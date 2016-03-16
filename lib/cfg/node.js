export class Node {
	constructor(value) {
		this.value = value;
		this.successors = new Set();
		this.predecessors = new Set();
	}

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