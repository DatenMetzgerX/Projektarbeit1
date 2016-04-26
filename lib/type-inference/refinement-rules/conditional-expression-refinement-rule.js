/**
 * Refinement rule for conditional expressions (test ? consequence : alternative)
 */
export class ConditionalExpressionRefinementRule {
	canRefine(node) {
		return node.type === "ConditionalExpression";
	}

	refine(node, context) {
		context.infer(node.test);

		const consequent = context.infer(node.consequent);
		const alternate = context.infer(node.alternate);
		return context.unify(consequent, alternate, node);
	}
}

export default ConditionalExpressionRefinementRule;