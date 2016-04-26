import {VoidType, AnyType} from "../../semantic-model/types";

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
		const propertySymbol = context.getSymbol(node.property);
		const objectType = context.getObjectType(node);

		if (objectType instanceof AnyType) {
			return AnyType.create();
		}

		// Accessing a property that does not exist is fine, e.g. if(x.address), the value is just void
		return objectType.getType(propertySymbol) || VoidType.create();
	}
}

export default MemberExpressionRefinementRule;