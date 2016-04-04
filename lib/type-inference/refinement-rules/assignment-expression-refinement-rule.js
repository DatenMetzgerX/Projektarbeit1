import {TypeInferenceError} from "../type-inference-error";
import BINARY_OPERATORS from "./binary-operators";

/**
 * Refinement rule for assignment expressions
 * @implements {RefinementRule}
 */
export class AssignmentExpressionRefinementRule {

	canRefine(node) {
		return node.type === "AssignmentExpression";
	}

	refine(node, context) {
		const assignee = context.getSymbol(node.left);

		if (node.operator === "=") {
			const rightRefinement = context.infer(node.right);

			context.setType(assignee, rightRefinement);
			return rightRefinement;
		}

		const binaryOperator = node.operator.replace("=", "");

		if (binaryOperator in BINARY_OPERATORS) {
			const leftType = context.infer(node.left);
			const rightType = context.infer(node.right);

			const operator = BINARY_OPERATORS[binaryOperator];
			return operator.refine(leftType, rightType, (t1, t2) => context.unify(t1, t2, node));
		}

		throw new TypeInferenceError(`The assignment operator ${node.operator} is not supported`, node);
	}
}

export default AssignmentExpressionRefinementRule;