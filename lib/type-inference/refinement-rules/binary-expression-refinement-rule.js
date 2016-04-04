import BINARY_OPERATORS from "./binary-operators";
import TypeInferenceError from "../type-inference-error";

/**
 * Refinement rule for binary expressions like 5 + 2
 * @implements {RefinementRule}
 */
export class BinaryExpressionRefinementRule {
	canRefine(node) {
		return node.type === "BinaryExpression";
	}

	refine(node, context) {
		if (!(node.operator in BINARY_OPERATORS)) {
			throw new TypeInferenceError(`The binary operator ${node.operator} is not supported.`, node);
		}
		const operator = BINARY_OPERATORS[node.operator];

		const leftExpressionType = context.infer(node.left);
		const rightExpressionType = context.infer(node.right);
		return operator.refine(leftExpressionType, rightExpressionType, (t1, t2) => context.unify(t1, t2, node));
	}
}

export default BinaryExpressionRefinementRule;