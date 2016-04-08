import {RecordType} from "../../semantic-model/types";
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
		const objectSymbol = context.getSymbol(memberNode.object);

		context.replaceType(objectSymbol, record => {
			record = context.unify(RecordType.ANY, record, memberNode);
			if (record.hasProperty(memberSymbol)) {
				return record.setType(memberSymbol, memberType);
			}
			return record.addProperty(memberSymbol, memberType);
		});
	}
}

export default AssignmentExpressionRefinementRule;