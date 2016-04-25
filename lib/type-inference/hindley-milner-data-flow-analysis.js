import Immutable from "immutable";
import process from "process";

import TypeEnvironment from "./type-environment";
import {createLabelForNode} from "../util";
import {WorkListDataFlowAnalysis} from "../data-flow-analysis/work-list-data-flow-analysis";

/**
 * Data flow analysis that uses the Hindley milner algorithm to calculate the transfer for a statement.
 */
export class HindleyMilnerDataFlowAnalysis extends WorkListDataFlowAnalysis{

	/**
	 * Creates a new hindley milner data flow analysis
	 * @param {TypeInferenceAnalysis} typeInferenceAnalysis the type inference analysis to use (e.g. forward or backward)
	 * @param {TypeEnvironment} [typeEnvironment] the start type environment
     */
	constructor(typeInferenceAnalysis, typeEnvironment=TypeEnvironment.EMPTY) {
		super();
		this.typeInferenceAnalysis = typeInferenceAnalysis;
		this.initTypeEnvironment = typeEnvironment;
	}

	createEmptyLattice() {
		return this.initTypeEnvironment;
	}

	transfer(node, inTypeEnvironment) {
		if (node === null) { // exit node
			return inTypeEnvironment;
		}

		const context = this.typeInferenceAnalysis.createHindleyMilnerContext(inTypeEnvironment);
		// process.stdout.write(`Infer types for node ${createLabelForNode(node)}...\n`);
		context.infer(node);
		const out = context.typeEnvironment;

		/*const diff = out.difference(inTypeEnvironment);
		process.stdout.write(`Difference for ${createLabelForNode(node)} to in state:\n`);
		diff.dump(process.stdout);
		process.stdout.write("\n"); */

		return out;
	}

	joinBranches(head, tail, node) {
		return this.typeInferenceAnalysis.joinTypeEnvironments(head, tail, node || {});
	}

	areStatesEqual(x, y) {
		return Immutable.is(x, y);
	}
}

export default HindleyMilnerDataFlowAnalysis;