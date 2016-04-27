import {StringType} from "../../semantic-model/types/string-type";
/**
 * Refinement rule for template literals like `Hy ${user}`.
 *
 * The current implementation is a simplification. It returns type string, instead of a template literal type.
 * For the current stage, a distinction between string and template literal is not needed. The only method that explicitly
 * requires a template literal is string.raw. This one is not widely used.
 * @implements {RefinementRule}
 */
export class TemplateLiteralRefinementRule {
	canRefine(node) {
		return node.type === "TemplateLiteral";
	}

	refine(node, context) {
		node.expressions.forEach(expression => context.infer(expression));

		return StringType.create();
	}
}

export default TemplateLiteralRefinementRule;