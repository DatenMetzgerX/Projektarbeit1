import assert from "assert";
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
		const properties = [];

		for (const property of node.properties) {
			const symbol = context.getSymbol(property);
			const type = context.infer(property.value);

			assert(symbol, `The symbol for the property ${property.key.name} is not set`);
			assert(type, `The type for the property ${symbol.name} is missing`);

			properties.push([symbol, type]);
		}

		return RecordType.withProperties(properties);
	}
}

export default ObjectExpressionRefinementRule;