import {NumberType, StringType, NullType, BooleanType} from "../../semantic-model/types";
import {TypeInferenceError} from "../type-inference-error";

/**
 * Refinement rule for number, string and null literals
 * @implements {RefinementRule}
 */
export class LiteralRefinementRule {
	canRefine(node) {
		switch (node.type) {
		case "NumericLiteral":
		case "StringLiteral":
		case "NullLiteral":
		case "BooleanLiteral":
			return true;
		default:
			return false;
		}
	}

	refine(node) {
		switch (node.type) {
		case "NumericLiteral":
			return NumberType.create();
		case "StringLiteral":
			return StringType.create();
		case "NullLiteral":
			return NullType.create();
		case "BooleanLiteral":
			return BooleanType.create();
		default:
			/* istanbul ignore next */
			throw new TypeInferenceError(`Node with type ${node.type} not supported by the literal refinement rule.`, node);
		}
	}
}

export default LiteralRefinementRule;