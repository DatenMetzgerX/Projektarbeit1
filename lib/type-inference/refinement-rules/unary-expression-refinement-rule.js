import {VoidType, BooleanType, NumberType, StringType} from "../../semantic-model/types";
import {TypeInferenceError} from "../type-inference-error";
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
		case "typeof":
			return new StringType();
		default:
			throw new TypeInferenceError(`The operator ${node.operator} for unary expressions is not yet supported`, node);
		}
	}
}

export default UnaryExpressionRefinementRule;