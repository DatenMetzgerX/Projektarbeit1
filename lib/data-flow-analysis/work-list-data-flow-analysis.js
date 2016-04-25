import assert from "assert";
import {FlowState} from "./flow-state";
/**
 * Work list algorithm for traversing the cfg.
 */
export class WorkListDataFlowAnalysis {

	/**
	 * Performs the data flow analysis over the given control flow graph.
	 * @param {ControlFlowGraph} cfg the control flow graph over which the analysis should be performed
	 * @param {*} [node] optional node value. If specified, then the analysis is only performed from this node to all it's exit nodes
     */
	analyse(cfg, node) {
		const initialWorkList = node ? cfg.getNodesToExit(node) : cfg.getNodes();
		const workList = new Set(initialWorkList);
		const outSets = new Map();

		while (workList.size) {
			const [node] = workList;
			workList.delete(node);

			const inState = this._joinInStatesFromPredecessors(node, outSets);
			const outBefore = outSets.get(node) || this.createEmptyLattice();
			const outState = this.transfer(node.value, inState);
			node.annotation = new FlowState(inState, outState);

			outSets.set(node, outState);
			if (!this.areStatesEqual(outBefore, outState)) {
				for (const successor of node.successors) {
					workList.add(successor.to);
				}
			}
		}
	}

	/**
	 * Creates a new empty lattice that is used to initialize the in and out states
	 * @returns the empty lattice
	 */
	createEmptyLattice() {
		assert.fail("Abstract, implementation in subclass required");
	}

	/**
	 * Determines the out state for the passed in node with the given in state
	 * @param node the node for which the out state should be determined
	 * @param inState the in state
	 * @returns the out state for this node
     */
	transfer(node, inState) { // eslint-disable-line no-unused-vars
		assert.fail("Abstract, implementation in subclass required");
	}

	/**
	 * Joins the out values from the predecessor nodes and returns the in value for the following node.
	 * @param head the lattice of the first predecessor
	 * @param {[]} tail the out lattices of the other predecessors
	 * @param node the node for which the in set is determined
	 * @returns the in set for the node
     */
	joinBranches(head, tail, node) { // eslint-disable-line no-unused-vars
		assert.fail("Abstract, implementation in subclass required");
	}

	/**
	 * Determines if two states are equal. Needed to determine if the transfer function caused any change compared
	 * to the previous out state
	 * @param first the first out state
	 * @param second the second out state
     */
	areStatesEqual(first, second) { // eslint-disable-line no-unused-vars
		assert.fail("Abstract, implementation in subclass required");
	}

	_joinInStatesFromPredecessors(node, outSets) {
		const outValues = [];
		for (const predecessorEdge of node.predecessors) {
			const outSet = outSets.get(predecessorEdge.src);
			if (outSet) {
				outValues.push(outSet);
			}
		}

		if (outValues.length === 0) {
			return this.createEmptyLattice();
		}

		const [head, ...tail] = outValues;
		if (tail.length === 0) {
			return head;
		}
		return this.joinBranches(head, tail, node.value);
	}
}

export default WorkListDataFlowAnalysis;