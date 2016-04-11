import {VoidType, RecordType} from "../../semantic-model/types";

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
		const objectSymbol = context.getSymbol(node.object);
		const memberSymbol = objectSymbol.getMember(node.property.name);

		// assign a new instance for the case that the object is still undeclared
		const objectType = context.getType(objectSymbol) || new RecordType();
		const record = context.unify(RecordType.ANY, objectType, node);

		let memberType = record.getType(memberSymbol);

		// When the record does not know the type of the member return type void (has never been declared);
		if (!memberType) {
			return new VoidType();
		}

		return memberType;
	}
}

export default MemberExpressionRefinementRule;