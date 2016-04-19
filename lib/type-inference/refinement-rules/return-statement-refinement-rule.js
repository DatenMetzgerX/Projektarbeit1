import Symbol from "../../semantic-model/symbol";
import {VoidType} from "../../semantic-model/types";

/**
 * Refinement rule that handles the return statement.
 * A return statement needs to find the enclosing function declaration and unifies the
 * return type of the function with the type resulting of the return expression
 * @implements {RefinementRule}
 */
export class ReturnStatementRefinementRule {
	canRefine(node) {
		return node.type === "ReturnStatement";
	}

	refine(node, context) {
		let argumentType = this._getReturnType(node, context);
		const returnType = context.getType(Symbol.RETURN);

		if (returnType) {
			argumentType = context.unify(returnType, argumentType, node);
			context.substitute(returnType, argumentType);
		} else {
			context.setType(Symbol.RETURN, argumentType);
		}

		return new VoidType();
	}

	_getReturnType (node, context){
		if (node.argument) {
			return context.infer(node.argument);
		}
		return new VoidType();
	}
}

export default ReturnStatementRefinementRule;