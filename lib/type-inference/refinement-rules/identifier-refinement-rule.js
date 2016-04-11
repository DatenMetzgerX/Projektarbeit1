import {VoidType} from "../../semantic-model/types";
import {TypeInferenceError} from "../type-inference-error";

/**
 * Refinement rule that refines the type for identifiers.
 *
 * There are two main cases of identifiers. The first case is the identifier "undefined". "undefined" has the type void.
 * The other case if the node represents a variable identifier. In this case the symbol table needs to be used to resolve
 * the symbol that belongs to the node and with the symbol the type can be resolved from the type environment.
 * If the type environment does not contain a type for the requested symbol, then the symbol is used before it's declaration.
 *
 * @implements {RefinementRule}
 */
export class IdentifierRefinementRule {
	canRefine(node) {
		return node.type === "Identifier";
	}

	refine(node, context) {
		if (node.name === "undefined") {
			return new VoidType();
		}

		const symbol = context.getSymbol(node);
		const type =  context.getType(symbol);

		if (!type) {
			throw new TypeInferenceError(`The symbol ${symbol.name} is being used before it's declaration`, node);
		}
		
		return type.fresh();
	}
}

export default IdentifierRefinementRule;