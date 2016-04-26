import {TypeInferenceError} from "../type-inference-error";
import {NumberType, MaybeType} from "../../semantic-model/types";

const numberT = NumberType.create();
const maybeNumber = MaybeType.of(numberT);

/**
 * Refinement rule for update expressions like ++, --
 * @implements {RefinementRule}
 */
export class UpdateExpressionRefinementRule {
	canRefine(node) {
		return node.type === "UpdateExpression";
	}

	refine(node, context) {
		if (node.operator !== "++" && node.operator !== "--") {
			throw new TypeInferenceError(`Unsupported update operator ${node.operator}.`, node);
		}

		const argumentType = context.infer(node.argument);
		context.unify(maybeNumber, argumentType, node.argument);
		return numberT;
	}
}

export default UpdateExpressionRefinementRule;