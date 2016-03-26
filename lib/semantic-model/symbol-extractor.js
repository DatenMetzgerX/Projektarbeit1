import assert from "assert";
import * as t from "babel-types";
import Symbol, {SymbolFlags} from "./symbol";

function registerMemberSymbol(memberExpression, scope, declarationNode) {
	const objectNode = memberExpression.object;
	const propertyNode = memberExpression.property;
	let objectSymbol;

	if (t.isMemberExpression(objectNode)) {
		objectSymbol = registerMemberSymbol(objectNode, scope);
	} else if (t.isIdentifier(objectNode)) {
		objectSymbol = registerIdentifier(objectNode, scope);
	} else {
		assert.fail(`Unsupported object expression of type ${objectNode.type}.`);
		return;
	}

	let member = objectSymbol.getMember(propertyNode.name);

	if (!member) {
		member = new Symbol(propertyNode.name, 0);
		member.declaration = declarationNode;
		objectSymbol.addMember(member);
	}

	if (declarationNode && member.declaration) {
		member.declaration = declarationNode;
	}

	memberExpression._symbol = member;
	return member;
}

/**
 * Resolves the symbol for the given identifier node in the given scope. If the symbol does not yet exists in the scope,
 * then a new symbol.
 * @param {Node} identifierExpression the identifier expression to resolve
 * @param {Scope} scope the scope in which the identifier expression needs to be resolved
 * @param {Node?} variableDeclarator the declarator that declares the identifier
 * @returns {Symbol} the symbol for this identifier
 */
function registerIdentifier(identifierExpression, scope, variableDeclarator) {
	let identifierSymbol;

	// resolve the symbol from the scope if it's not being declared, otherwise resolve the symbol from any scope.
	if (variableDeclarator && scope.hasOwnSymbol(identifierExpression.name) || scope.hasSymbol(identifierExpression.name)) {
		identifierSymbol = scope.resolveSymbol(identifierExpression.name);
	} else {
		identifierSymbol = new Symbol(identifierExpression.name, SymbolFlags.Variable);
		scope.addSymbol(identifierSymbol);
	}

	if (variableDeclarator) {
		identifierSymbol.declaration = variableDeclarator;

		if (variableDeclarator.init) {
			identifierSymbol.valueDeclaration = variableDeclarator.init;
		}
	}

	identifierExpression._symbol = identifierSymbol;

	return identifierSymbol;
}

const visitor = {

	/**
	 * A new child scope needs to be created when entering the node and needs to be left when the scope is exited
	 */
	Block: {
		enter (path) {
			this.scope = this.scope.createChild();
			path.node.scope = this.scope;
		},
		exit () {
			this.scope = this.scope.parent;
		}
	},

	VariableDeclarator (path) {
		registerIdentifier(path.node.id, this.scope, path.node);
	},

	AssignmentExpression (path) {
		const target = path.get("left");

		if (target.isMemberExpression()) {
			registerMemberSymbol(target.node, this.scope, path.node);
		} else if (target.isIdentifier()) {
			registerIdentifier(target.node, this.scope);
		}
	}
};

export class SymbolExtractor {
	constructor(globalScope) {
		this.scope = globalScope;
	}

	get visitor() { return visitor; }
	get state() { return { scope: this.scope }; }
}

export default SymbolExtractor;