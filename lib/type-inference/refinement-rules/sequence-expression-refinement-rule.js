import {VoidType} from "../../semantic-model/types";

/**
 * Refinement Rule for sequence expressions like x, a
 * @implements {RefinementRule}
 */
export class SequenceExpressionRefinementRule {
	canRefine(node) {
		return node.type === "SequenceExpression";
	}

	refine(node, context) {
		let type = VoidType.create();

		for (const expression of node.expressions) {
			type = context.infer(expression);
		}

		return type;
	}
}

export default SequenceExpressionRefinementRule;