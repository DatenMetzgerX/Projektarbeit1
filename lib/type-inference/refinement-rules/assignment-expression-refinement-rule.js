import {TypeInferenceError} from "../type-inference-error";
import BINARY_OPERATORS from "./binary-operators";
import {AnyType} from "../../semantic-model/types";

/**
 * Refinement rule for assignment expressions
 * @implements {RefinementRule}
 */
export class AssignmentExpressionRefinementRule {

	canRefine(node) {
		return node.type === "AssignmentExpression";
	}

	refine(node, context) {
		let rightType;

		if (node.operator === "=") {
			rightType = context.infer(node.right);
		} else {
			rightType = this._getTypeFromBinaryOperator(node, context);
		}

		this._setTypeForAssignee(node.left, rightType.fresh(), context);

		return rightType;
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

	_setTypeForAssignee(assigneeNode, rightHandSideType, context) {
		if (assigneeNode.type === "MemberExpression") {
			this._setPropertyType(assigneeNode, rightHandSideType, context);
		} else {
			const symbol = context.getSymbol(assigneeNode);
			context.setType(symbol, rightHandSideType);
		}
	}

	_setPropertyType(assigneeNode, propertyType, context) {
		const objectType = context.getObjectType(assigneeNode);
		const propertySymbol = context.getSymbol(assigneeNode.property);

		if (objectType instanceof AnyType) {
			return;
		}

		let updatedObjectType;
		if (objectType.hasProperty(propertySymbol)) {
			updatedObjectType = objectType.setType(propertySymbol, propertyType);
		} else {
			updatedObjectType = objectType.addProperty(propertySymbol, propertyType);
		}

		context.substitute(objectType, updatedObjectType);
	}
}

export default AssignmentExpressionRefinementRule;