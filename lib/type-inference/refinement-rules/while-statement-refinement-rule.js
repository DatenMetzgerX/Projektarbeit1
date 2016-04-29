import {VoidType} from "../../semantic-model/types";

/**
 * Refinement Rule for a while or do while statement
 * @implements {RefinementRule}
 */
export class WhileStatementRefinementRule {
	canRefine(node) {
		return node.type === "WhileStatement" || node.type === "DoWhileStatement";
	}

	refine(node, context) {
		context.infer(node.test);
		return VoidType.create();
	}
}

export default WhileStatementRefinementRule;