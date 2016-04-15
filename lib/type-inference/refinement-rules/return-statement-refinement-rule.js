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
		const returnSymbol = context.getSymbol(node);
		const argumentType = this._getReturnType(node, context);

		let returnType = context.getType(returnSymbol);

		if (returnType) {
			returnType = context.unify(returnType, argumentType, node);
		} else {
			returnType = argumentType;
		}

		context.setType(returnSymbol, returnType);

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