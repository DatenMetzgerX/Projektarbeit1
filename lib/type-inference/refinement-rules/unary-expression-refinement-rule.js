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
			return VoidType.create();
		case "+":
		case "-":
		case "~":
			context.unify(argumentType, NumberType.create(), node);
			return NumberType.create();
		case "!":
			return BooleanType.create();
		case "typeof":
			return StringType.create();
		default:
			throw new TypeInferenceError(`The operator ${node.operator} for unary expressions is not yet supported`, node);
		}
	}
}

export default UnaryExpressionRefinementRule;