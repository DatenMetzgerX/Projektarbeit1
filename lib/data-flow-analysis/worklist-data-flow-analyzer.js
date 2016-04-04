import assert from "assert";
import {FlowState} from "./flow-state";

/**
 * Interface for a data flow analysis
 *
 * @typedef {Object} DataFlowAnalysis
 * @interface
 * @template L type of the lattice
 *
 * @property {function (outValues: L[]): L} joinBranches joins the out values from the predecessor nodes and returns the in value for the following node.
 * @property {function (): L} createEmptyLattice creates a new empty lattice that is used to initialize the in and out states
 * @property {function (): L} createEntryLattice creates the entry lattice that is used to initialize the in state of the cfg.entry node
 * @property {function (node: ASTNode, inState: L): L} determines the out state for the passed in node with the given in state
 * @property {function (x: L, y: L): true} determines if the two lattices are equal or not
 */

/**
 * TODO
 */
/* istanbul ignore next */
export class WorklistDataFlowAnalyzer {
	/**
	 * Creates a new data flow analyzer that uses the work list algorithm.
	 * @param {!ControlFlowGraph} cfg the control flow graph to analyse
	 * @param {!DataFlowAnalysis} analysis the data flow analysis that should be applied to the control flow graph
     */
	constructor(cfg, analysis) {
		assert(cfg, "The data flow analysis requires a control flow graph");
		assert(analysis, "A analysis implementation needs to be defiend");
		this.cfg = cfg;
		this.analisis = analysis;
	}

	analyze() {
		this.initialize();
		// todo nodes should be sorted depending on forward or reverse analysis
		// most probably it is prefered to first start with all entry nodes and then proceed with non entry nodes
		const worklist = new Set(this.cfg.getNodes());

		while (worklist.size) {
			const [node] = worklist;
			worklist.delete(node);

			this.joinInSetsFromPredecessors(node);

			const outBefore = node.annotation.out;
			node.annotation.out = this.analisis.transfer(node.value, node.annotation.in);
			if (!this.analisis.areLatticesEqual(outBefore, node.annotation.out)) {
				for (const successor of node.successors) {
					worklist.add(successor.to);
				}
			}
		}
	}

	/**
	 * Initializes the in and out state for each node with the default entry lattice, except for the
	 * first cfg node, the entry lattice is assigned
	 * @private
	 */
	initialize() {
		for (const node of this.cfg.getNodes()) {
			let inLattice = node === this.cfg.entry ? this.analisis.createEntryLattice() : this.analisis.createEmptyLattice();
			node.annotation = new FlowState(inLattice, this.analisis.createEmptyLattice());
		}
	}

	joinInSetsFromPredecessors(node) {
		const outValues = [];
		for (const predecessor of node.predecessors) {
			outValues.push(predecessor.src.annotation.out);
		}
		node.annotation.in = this.analisis.joinBranches(outValues);
	}
}

export default WorklistDataFlowAnalyzer;