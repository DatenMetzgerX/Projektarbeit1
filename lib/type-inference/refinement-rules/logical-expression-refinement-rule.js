import {BooleanType} from "../../semantic-model/types/boolean-type";
/**
 * Refinement rule for logical expressions like && or ||.
 * @implements {RefinementRule}
 */
export class LogicalExpressionRefinementRule {
	canRefine(node) {
		return node.type === "LogicalExpression";
	}

	refine(node, context) {
		context.infer(node.left);
		context.infer(node.right);
		return BooleanType.create();
	}
}

export default LogicalExpressionRefinementRule;