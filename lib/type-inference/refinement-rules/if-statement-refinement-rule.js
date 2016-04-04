import {VoidType} from "../../semantic-model/types";

/**
 * Refinement rule for if statements.
 * The refinement rule infers the types in the test expression.
 * @implements {RefinementRule}
 */
export class IfStatementRefinementRule {
	canRefine(node) {
		return node.type === "IfStatement";
	}

	refine(node, context) {
		context.infer(node.test);
		return new VoidType();
	}
}

export default IfStatementRefinementRule;