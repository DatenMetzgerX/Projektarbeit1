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
		let memberType;

		if (node.operator === "=") {
			memberType = context.infer(node.right);
		} else {
			memberType = this._getTypeFromBinaryOperator(node, context);
		}

		context.setNodeType(node.left, memberType);

		return memberType;
	}

	_getTypeFromBinaryOperator(node, context) {
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