import {VoidType} from "../../semantic-model/types";

/**
 * Refinement rule for for(init; test; update)
 */
export class ForStatementRefinementRule {
	canRefine(node) {
		return node.type === "ForStatement";
	}

	refine(node, context) {
		if (node.init) {
			context.infer(node.init);
		}

		if (node.test) {
			context.infer(node.test);
		}

		if (node.update) {
			context.infer(node.update);
		}

		return VoidType.create();
	}
}

export default ForStatementRefinementRule;