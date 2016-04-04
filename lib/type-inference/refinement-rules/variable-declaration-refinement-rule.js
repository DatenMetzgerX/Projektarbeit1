import {VoidType} from "../../semantic-model/types";

/**
 * Refinement rule that handles variable declaration and variable declarators
 * @implements {RefinementRule}
 */
export class VariableDeclarationRefinementRule {
	canRefine(node) {
		return node.type === "VariableDeclaration" || node.type === "VariableDeclarator";
	}

	refine(node, context) {
		if (node.type === "VariableDeclaration") {
			return this.refineVariableDeclaration(node, context);
		} else {
			return this.refineVariableDeclarator(node, context);
		}
	}

	refineVariableDeclarator(node, context) {
		let variableType;
		if (node.init) {
			variableType = context.infer(node.init);
		} else {
			variableType = new VoidType();
		}

		const variableSymbol = context.getSymbol(node.id);

		context.setType(variableSymbol, variableType);
		return variableType;
	}

	refineVariableDeclaration(node, context) {
		// adds all declared variables to the type environment
		for (const declarator of node.declarations) {
			this.refineVariableDeclarator(declarator, context);
		}

		return new VoidType();
	}
}

export default VariableDeclarationRefinementRule;