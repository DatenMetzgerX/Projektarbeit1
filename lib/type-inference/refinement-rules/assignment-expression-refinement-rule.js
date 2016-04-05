import {RecordType, TypeVariable, MaybeType, NullType, VoidType} from "../../semantic-model/types";
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
		const assignee = this._getAssigneeSymbol(node.left, context);
		let memberType;

		if (node.operator === "=") {
			memberType = context.infer(node.right);
		} else {
			memberType = this._getTypeFromBinaryOperator(node, context);
		}

		context.setType(assignee, memberType);

		if (node.left.type === "MemberExpression") {
			this._handleMemberExpressionAssignment(node.left, assignee, memberType, context);
		}

		return memberType;
	}

	_getAssigneeSymbol(node, context) {
		if (node.type === "MemberExpression") {
			const objectSymbol = context.getSymbol(node.object);
			return objectSymbol.getMember(node.property.name);
		}

		return context.getSymbol(node);
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

	_handleMemberExpressionAssignment(memberNode, memberSymbol, memberType, context) {
		const objectRecord = this._getObjectType(memberNode.object, context);

		if (objectRecord.hasProperty(memberSymbol)) {
			objectRecord.setType(memberSymbol, memberType);
		} else {
			objectRecord.addProperty(memberSymbol, memberType);
		}
	}

	_getObjectType(objectNode, context) {
		const objectSymbol = context.getSymbol(objectNode);
		const objectType = context.getType(objectSymbol);

		if (objectType instanceof RecordType) {
			return objectType;
		}

		if (objectType instanceof TypeVariable) {
			let record = new RecordType();
			objectType.resolvesTo(record);
			return record;
		}

		if (objectType instanceof MaybeType || objectType instanceof NullType || objectType instanceof VoidType) {
			throw new TypeInferenceError(`Potential null pointer access, object ${objectSymbol.name} is inferred as type ${objectType} that could potentially be null.`, objectNode);
		}

		throw new TypeInferenceError(`The object type ${objectType} is no record type.`, objectNode);
	}
}

export default AssignmentExpressionRefinementRule;