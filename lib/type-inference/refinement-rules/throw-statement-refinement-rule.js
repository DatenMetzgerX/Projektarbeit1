import {VoidType} from "../../../lib/semantic-model/types";

/**
 * Refinement rule for throw x;
 * @implements {RefinementRule}
 */
export class ThrowStatementRefinementRule {
	canRefine(node) {
		return node.type === "ThrowStatement";
	}

	refine(node, context) {
		if (node.argument) {
			context.infer(node.argument);
		}

		return VoidType.create();
	}
}

export default ThrowStatementRefinementRule;