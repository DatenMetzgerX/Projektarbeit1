import {FunctionRefinementRule} from "./refinement-rules/function-refinement-rule";
import {TypeInferenceContext} from "./type-inference-context";
/**
 * Visitor that infers the base type for all functions.
 * Functions are hoisted therefore need to be defined before it's node is visited
 */
export class FunctionDeclarationVisitor {

	constructor(program, typeEnvironment) {
		this.program = program;
		this.typeEnvironment = typeEnvironment;
	}

	enterFunctionDeclaration(path) {
		const context = new TypeInferenceContext(this.program, this.typeEnvironment);
		FunctionRefinementRule.inferFunctionType(path.node, context);

		this.typeEnvironment = context.typeEnvironment;
	}

	defaultHandler() {
		// OK
	}
}