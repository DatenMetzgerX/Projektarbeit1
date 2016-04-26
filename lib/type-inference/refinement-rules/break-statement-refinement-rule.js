import {VoidType} from "../../semantic-model/types";

const voidT = VoidType.create();

/**
 * Refinement rule for a break statement
 * @implements {RefinementRule}
 */
export class BreakStatementRefinementRule {
	canRefine(node) {
		return node.type === "BreakStatement";
	}

	refine() {
		return voidT;
	}
}

export default BreakStatementRefinementRule;