import {RecordType} from "../../semantic-model/types";
/**
 * Refinement rule for object expressions.
 *
 * The refinement creates a record type and adds one property for each property in the object expression.
 * The type of the property is inferred.
 *
 * @implements {RefinementRule}
 */
export class ObjectExpressionRefinementRule {
	canRefine(node) {
		return node.type === "ObjectExpression";
	}

	refine(node, context) {
		const record = new RecordType();

		for (const property of node.properties) {
			record.addProperty(context.getSymbol(property), context.infer(property.value));
		}

		return record;
	}
}

export default ObjectExpressionRefinementRule;