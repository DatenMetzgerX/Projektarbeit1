import {VoidType} from "../../semantic-model/types";

/**
 * Refinement rule for a block statement
 * @implements {RefinementRule}
 */
export class BlockStatementRefinementRule {
	canRefine(node) {
		return node.type === "BlockStatement";
	}

	refine() {
		return new VoidType();
	}
}

export default BlockStatementRefinementRule;