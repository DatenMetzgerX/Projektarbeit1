import {TypeInferenceError} from "../type-inference-error";
/**
 * Refinement rule for this
 * @implements {RefinementRule}
 */
export class ThisExpressionRefinementRule {
	canRefine(node) {
		return node.type === "ThisExpression";
	}

	refine(node, context) {
		const symbol = context.getSymbol(node);
		const type = context.getType(symbol);

		if (!type) {
			throw new TypeInferenceError("Access to this outside of a function", node);
		}

		return type;
	}
}

export default ThisExpressionRefinementRule;