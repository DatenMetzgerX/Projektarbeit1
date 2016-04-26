import Immutable from "immutable";

import TypeEnvironment from "./type-environment";
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
		context.infer(node);
		return context.typeEnvironment;
	}

	joinBranches(head, tail, node) {
		return this.typeInferenceAnalysis.joinTypeEnvironments(head, tail, node || {});
	}

	areStatesEqual(x, y) {
		return Immutable.is(x, y);
	}
}

export default HindleyMilnerDataFlowAnalysis;