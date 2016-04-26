import {ArrayType, VoidType} from "../../semantic-model/types";
import {TypeInferenceError} from "../type-inference-error";

/**
 * For of statement refinement rule
 * @implements {RefinementRule}
 */
export class ForOfStatementRefinementRule {
	canRefine(node) {
		return node.type === "ForOfStatement";
	}

	refine(node, context) {
		const tLeft = context.infer(node.left);
		const tRight = context.infer(node.right);

		if (tRight instanceof ArrayType) {
			context.substitute(tLeft, tRight.of);
		} else {
			throw new TypeInferenceError(`The type ${tRight} does not support iteration.`, node.right);
		}

		return VoidType.create();
	}
}

export default ForOfStatementRefinementRule;