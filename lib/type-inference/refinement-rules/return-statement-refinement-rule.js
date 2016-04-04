import * as t from "babel-types";
import {VoidType} from "../../semantic-model/types";
import {TypeInferenceError} from "../type-inference-error";

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
		const functionNode = this._getFunction(node);
		if (!functionNode.id) {
			throw new TypeInferenceError("return statements inside of anonymous functions are not yet supported", node);
		}

		const functionSymbol = context.getSymbol(functionNode.id);
		const functionType = context.getType(functionSymbol);
		const returnType = this._getReturnType(node, context);

		context.unify(functionType.returnType, returnType, node);
		return new VoidType();
	}

	_getReturnType (node, context){
		if (node.argument) {
			return context.infer(node.argument);
		} else {
			return new VoidType();
		}
	}

	_getFunction(node) {
		let current = node;
		while (current) {
			if (t.isFunction(current)) {
				return current;
			}
			current = current.parent;
		}
	}
}

export default ReturnStatementRefinementRule;