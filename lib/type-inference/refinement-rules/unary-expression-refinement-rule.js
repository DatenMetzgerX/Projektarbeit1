import assert from "assert";
import {VoidType, BooleanType, NumberType} from "../../semantic-model/types";
/**
 * Refinement Rule for unary expressions
 * @implements {RefinementRule}
 */
export class UnaryExpressionRefinementRule {
	canRefine(node) {
		return node.type === "UnaryExpression";
	}

	refine(node, context) {
		const argumentType = context.infer(node.argument);

		switch (node.operator) {
		case "void":
			return new VoidType();
		case "+":
		case "-":
		case "~":
			context.unify(argumentType, new NumberType(), node);
			return new NumberType();
		case "!":
			return new BooleanType();
		default:
			assert.fail(`The operator ${node.operator} for unary expressions is not yet supported`);
		}
	}
}

export default UnaryExpressionRefinementRule;