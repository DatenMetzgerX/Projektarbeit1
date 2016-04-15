import {TypeInferenceError} from "../type-inference-error";

/**
 * Refinement rule for a member expressions.
 *
 * The refinement rule uses the object symbol to resolve the type of a member.
 * If the member has not yet a type variable associated with it in the type environment,
 * then a new type variable is created and associated with the symbol of the member.
 *
 * The implementation does change the structure of the record type at all, as it does not know if it is a
 * read or write access. Adding new Members to record types is performed in the assignment expression
 * refinement rule.
 *
 * @implements {RefinementRule}
 */
export class MemberExpressionRefinementRule {
	canRefine(node) {
		return node.type === "MemberExpression";
	}

	refine(node, context) {
		const memberType = context.getNodeType(node);

		if (!memberType) {
			const objectType = context.getNodeType(node.object);
			throw new TypeInferenceError(`The member ${node.property.name} is missing in ${objectType}`, node);
		}

		return memberType;
	}
}

export default MemberExpressionRefinementRule;