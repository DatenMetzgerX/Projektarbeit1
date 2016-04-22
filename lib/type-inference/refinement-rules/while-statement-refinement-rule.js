import {VoidType} from "../../semantic-model/types/void-type";
const voidT = new VoidType();

/**
 * Refinement Rule for a while statement
 * @implements {RefinementRule}
 */
export class WhileStatementRefinementRule {
	canRefine(node) {
		return node.type === "WhileStatement";
	}

	refine(node, context) {
		context.infer(node.test);
		return voidT;
	}
}

export default WhileStatementRefinementRule;