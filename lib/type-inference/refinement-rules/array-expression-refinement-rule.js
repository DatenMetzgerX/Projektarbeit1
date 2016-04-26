import {ArrayType, TypeVariable, AnyType} from "../../semantic-model/types";
import {NotUnifiableError} from "../type-unificator";
import {TypeInferenceError} from "../type-inference-error";
/**
 * Refinement rule for an array expression
 * @implements {RefinementRule}
 */
export class ArrayExpressionRefinementRule {
	canRefine(node) {
		return node.type === "ArrayExpression";
	}

	refine(node, context) {
		let elementType = node.elements.reduce((arrayType, element) => this._unifyElementType(element, arrayType, context), TypeVariable.create());

		return ArrayType.of(elementType);
	}

	_unifyElementType(element, arrayType, context) {
		const elementType = context.infer(element, context);
		try {
			return context.unify(elementType, arrayType, element);
		} catch (e) {
			// that's ugly... but unification fails if there is no unification rule
			// there is no unification rule for number and string, but in this case the array should be of type any
			if (e instanceof TypeInferenceError && e.cause instanceof NotUnifiableError) {
				return AnyType.create();
			}

			throw e;
		}
	}
}

export default ArrayExpressionRefinementRule;