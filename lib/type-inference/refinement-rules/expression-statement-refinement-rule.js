import {VoidType} from "../../semantic-model/types";

/**
 * Refinement rule for an expression statement. The type of an expression statement is always void.
 * The types of the expression needs to be evaluated.
 * @implements {RefinementRule}
 */
export class ExpressionStatementRefinementRule {
	canRefine(node) {
		return node.type === "ExpressionStatement";
	}

	refine(node, context) {
		context.infer(node.expression);
		return new VoidType();
	}
}

export default ExpressionStatementRefinementRule;