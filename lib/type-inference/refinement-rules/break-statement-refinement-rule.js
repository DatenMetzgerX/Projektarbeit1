import {VoidType} from "../../semantic-model/types";

/**
 * Refinement rule for a break statement
 * @implements {RefinementRule}
 */
export class BreakStatementRefinementRule {
	canRefine(node) {
		return node.type === "BreakStatement";
	}

	refine() {
		return VoidType.create();
	}
}

export default BreakStatementRefinementRule;