import assert from "assert";
import Symbol, {SymbolFlags} from "./symbol";

/**
 * Stateful visitor. Babel-traverse does not allow visitors to have own methods. This requires to pass the whole
 * internal state to the external function what leads to long parameter lists that are to avoid. So instead use this
 * class that can keep it's own state.
 */
class SymbolExtractorVisitor {
	constructor (program) {
		this.scope = program.globalScope;
		this.program = program;
	}

	enterBlock(path) {
		if (path.isProgram()) {
			path.node.scope = this.scope;
			return;
		}

		this.scope = this.scope.createChild();
		path.node.scope = this.scope;
	}

	exitBlock(path) {
		if (!path.isProgram()) {
			this.scope = this.scope.parent;
		}
	}

	identifier (path) {
		this._registerIdentifier(path);
	}

	assignmentExpression (path) {
		const target = path.get("left");

		if (target.isMemberExpression()) {
			this._registerMemberSymbol(target, path.node);
		} else if (target.isIdentifier()) {
			this._registerIdentifier(target);
			target.stop();
		}
	}

	functionDeclaration (path) {
		if (path.node.id) {
			// avoid registering the id in the function scope. Regsiter the id here where we are still in the parent scope.
			path.skipKey("id");
			this._registerIdentifier(path.get("id"));
		}
	}

	_registerMemberSymbol(memberExpression, declarationNode) {
		const objectNode = memberExpression.get("object");
		const propertyNode = memberExpression.node.property;
		let objectSymbol;

		if (objectNode.isMemberExpression()) {
			objectSymbol = this._registerMemberSymbol(objectNode);
		} else if (objectNode.isIdentifier()) {
			objectSymbol = this._registerIdentifier(objectNode);
		} else {
			assert.fail(`Unsupported object expression of type ${objectNode.node.type}.`);
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

		this.program.symbolTable.setSymbol(memberExpression.node, member);
		return member;
	}

	/**
	 * Resolves the symbol for the given identifier node in the given scope. If the symbol does not yet exists in the scope,
	 * then a new symbol.
	 * @param {Path} identifierExpression the identifier expression to resolve
	 * @param {Node?} variableDeclarator the declarator that declares the identifier
	 * @returns {Symbol} the symbol for this identifier
	 */
	_registerIdentifier(identifierExpression) {
		let identifierSymbol;
		// it's a declaration if it is the identifier of a function or one of it's parameters or if this node is the id of a variable declaration
		let declaration = identifierExpression.parentPath && (identifierExpression.parentPath.isFunction() || (identifierExpression.parentPath.isVariableDeclarator() && identifierExpression.parent.id === identifierExpression.node));

		// resolve the symbol from the scope if it's a declaration, otherwise resolve the symbol from any scope.
		if (this.scope.hasOwnSymbol(identifierExpression.node.name) || (!declaration && this.scope.hasSymbol(identifierExpression.node.name))) {
			identifierSymbol = this.scope.resolveSymbol(identifierExpression.node.name);
		} else {
			identifierSymbol = new Symbol(identifierExpression.node.name, SymbolFlags.Variable);
			this.scope.addSymbol(identifierSymbol);
		}

		if (declaration) {
			identifierSymbol.declaration = identifierExpression.parent;

			if (identifierExpression.parent.init) {
				identifierSymbol.valueDeclaration = identifierExpression.parent.init;
			}
		}

		this.program.symbolTable.setSymbol(identifierExpression.node, identifierSymbol);

		return identifierSymbol;
	}
}

const visitor = {
	Identifier (path) {
		this.internalVisitor.identifier(path);
	},

	AssignmentExpression (path) {
		this.internalVisitor.assignmentExpression(path);
	},

	Function (path) {
		this.internalVisitor.functionDeclaration(path);
	},

	/**
	 * A new child scope needs to be created when entering the node and needs to be left when the scope is exited
	 * IMPORTANT: This needs to be the last rule so that any more specific enter rules are executed before this enter rule.
	 * This is e.g. needed for function declarations, where the id of the function needs to be registered in the outer scope,
	 * but the parameter need to be registered in the inner scope
	 */
	Scopable: {
		enter (path) {
			this.internalVisitor.enterBlock(path);
		},
		exit (path) {
			this.internalVisitor.exitBlock(path);
		}
	}
};

export class SymbolExtractor {
	constructor(program) {
		this.program = program;
	}

	get visitor() { return visitor; }
	get state() { return { internalVisitor: new SymbolExtractorVisitor(this.program) }; }
}

export default SymbolExtractor;