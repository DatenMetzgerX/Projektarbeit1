import assert from "assert";
import Symbol, {SymbolFlags} from "./symbol";

/**
 * AST-Visitor that builds up the symbol table by traversing the AST.
 *
 * The implementation assigns each node with the related id. E.g. if an identifier is used, then the symbol for this
 * identifier associated with the identifier node. Beside the identifier nodes, also additional nodes are assigned with
 * it's symbols. E.g. the symbol of the related object in an object expression is assigned to the object node of the member expression.
 *
 * The symbol extractor does
 */
export class SymbolExtractor {
	/**
	 * Creates a new visitor that can analyse the given program
	 * @param {Program} program the program to analyse
     */
	constructor(program) {
		/**
		 * The analysed program
		 * @type {Program}
		 */
		this.program = program;

		/**
		 * The current active scope
		 * @type {Scope}
         */
		this.scope = this.program.globalScope;
	}

	/**
	 * Assignes the global scope to the program node
     */
	enterProgram(path) {
		path.node.scope = this.scope;
	}

	// --------------------------------------
	// Statements
	// --------------------------------------
	enterEmptyStatement() {}

	enterBlockStatement(path) {
		this._enterScope(path);
	}

	exitBlockStatement() {
		this._exitScope();
	}

	enterExpressionStatement(path) {
		this._resolveIdentifiers(path.get("expression"));
	}

	enterIfStatement(path) {
		this._resolveIdentifiers(path.get("test"));
	}

	enterLabeledStatement() {}
	enterBreakStatement() {}
	enterContinueStatement() {}

	enterReturnStatement(path) {
		this._resolveIdentifiers(path.get("argument"));
	}

	enterForStatement(path) {
		this._resolveIdentifiers(path.get("init"), path.get("test"), path.get("update"));
	}

	// --------------------------------------
	// Statements
	// --------------------------------------
	/**
	 * Declares the function in the parent scope and the params in a new child scope.
	 * Leaves the scope at the end of the function
	 * @constructor
	 */
	enterFunctionDeclaration(path) {
		if (path.node.id) {
			const symbol = this._declareIdentifierInScope(path.get("id").node, SymbolFlags.Function);
			symbol.declaration = symbol.valueDeclaration = path.node;
		}

		this._enterScope(path);

		for (const param of path.node.params) {
			const paramSymbol = this._declareIdentifierInScope(param, SymbolFlags.Variable);
			paramSymbol.declaration = param;
		}
	}

	exitFunctionDeclaration() {
		this._exitScope();
	}

	enterVariableDeclaration() {}

	/**
	 * Creates a symbol for each declaration in the current scope
	 */
	enterVariableDeclarator(path) {
		const symbol = this._declareIdentifierInScope(path.node.id, SymbolFlags.Variable);
		symbol.declaration = path.node;

		if (path.node.init) {
			this._resolveIdentifiers(path.get("init"));
			symbol.valueDeclaration = path.node.init;
		}
	}

	// --------------------------------------
	// Expressions
	// --------------------------------------

	/**
	 * Resolves the symbol for the object node by inspecting it's parent context.
	 * The symbol of the object is assigned to the current node
	 * @constructor
     */
	enterObjectExpression(path) {
		let object;
		const parentPath = path.parentPath;
		// Object expression is used in a variable initialisation. Therefore the symbol of the object needs to be the
		// same as the symbol of the variable
		if (parentPath.isVariableDeclarator()) {
			object = this._resolveIdentifier(path.parent.id);
		}
		// If the parent is an assignment expression, then the object is the left hand side of the assignment (the target)
		else if (parentPath.isAssignmentExpression()) {
			object =  this.enterAssignmentExpression(parentPath);
		}
		// If it is a call expression, then this is an anonymous symbol that is created and directly passed as argument
		else if (parentPath.isCallExpression()) {
			object = new Symbol("anonymous object", SymbolFlags.None);
		}
		// If the parent is an object property, then this is a nested object
		else if (parentPath.isObjectProperty()) {
			object = this.enterObjectProperty(parentPath);
		}
		// No idea what it is, fail fast
		else {
			/* istanbul ignore next */
			assert.fail(`Object symbol for parent node ${parentPath.node.type} could not be resolved`);
		}

		this.program.symbolTable.setSymbol(path.node, object);
	}

	enterObjectProperty(path) {
		const property = this._declareObjectMember(path);
		property.valueDeclaration = path.node.value;
		return property;
	}

	enterObjectMethod(path) {
		return this._declareObjectMember(path);
	}

	enterUnaryExpression(path) {
		this._resolveIdentifiers(path.get("argument"));
	}

	enterBinaryExpression(path) {
		this._resolveIdentifiers(path.get("left"), path.get("right"));
	}

	enterAssignmentExpression(path) {
		let assignee;

		if (path.get("left").isIdentifier()) {
			assignee = this._resolveIdentifier(path.node.left, SymbolFlags.Variable);
		} else if (path.get("left").isMemberExpression()) {
			assignee = this._resolveMember(path.get("left"));
			assignee.declaration = assignee.declaration || path.node;
		} else {
			/* istanbul ignore next */
			assert.fail(`Unsupported left hand side of assignment ${path.node.left.type}.`);
		}

		assignee.valueDeclaration = assignee.valueDeclaration || path.node;
		this._resolveIdentifiers(path.get("right"));

		return assignee;
	}

	enterUpdateExpression(path) {
		this._resolveIdentifiers(path.get("argument"));
	}

	enterLogicalExpression(path) {
		this._resolveIdentifiers(path.get("left"), path.get("right"));
	}

	enterCallExpression(path) {
		this._resolveIdentifiers(...path.get("arguments"));
	}

	/**
	 * Creates a symbol for the member in it's enclosing object and assigns the symbol of the property to the property node
	 * and the object symbol to the object node
	 */
	enterMemberExpression(path) {
		this._resolveMember(path);
	}

	// --------------------------------------
	// Miscellaneous
	// --------------------------------------
	enterStringLiteral() {}
	enterNumericLiteral() {}
	enterBooleanLiteral() {}
	enterNullLiteral() {}

	/**
	 * The implementation does not tread identifiers here as the usage of an identifier is very specific on what the direct
	 * parent element is. The parent element is responsible to register any identifier that can appear in any direct child element
	 * (e.g. an identifier can be used in the test, update and init of a for loop (for(x;x;x) {})
	 * @constructor
     */
	enterIdentifier() {}

	defaultHandler(path) {
		/* istanbul ignore next */
		assert.fail(`Unsupported node type for symbol extraction '${path.node.type}.`);
	}

	/**
	 * Enters a new child scope
	 * @private
     */
	_enterScope(path) {
		this.scope = this.scope.createChild();
		path.node.scope = this.scope;
	}

	/**
	 * Leaves the current scope
	 * @private
     */
	_exitScope() {
		this.scope = this.scope.parent;
	}

	_declareIdentifierInScope(identifierNode, flags) {
		let symbol;

		if (this.scope.hasOwnSymbol(identifierNode.name)) {
			symbol = this.scope.resolveSymbol(identifierNode.name);
		} else {
			symbol = new Symbol(identifierNode.name, flags);
			this.scope.addSymbol(symbol);
		}

		this.program.symbolTable.setSymbol(identifierNode, symbol);
		symbol.flags = flags;

		return symbol;
	}

	_resolveIdentifiers(...paths) {
		const identifiers = paths.filter(path => path.isIdentifier());
		identifiers.forEach(identifier => this._resolveIdentifier(identifier.node, SymbolFlags.Variable));
	}

	_resolveIdentifier(identifierNode, flags=SymbolFlags.UNKNOWN) {
		let symbol;
		if (this.scope.hasSymbol(identifierNode.name)) {
			symbol = this.scope.resolveSymbol(identifierNode.name);
		} else {
			symbol = new Symbol(identifierNode.name, flags);
			this.scope.addSymbol(symbol);
		}

		this.program.symbolTable.setSymbol(identifierNode, symbol);

		return symbol;
	}

	_resolveMember(memberPath) {
		let object;
		if (memberPath.get("object").isIdentifier()) {
			object = this._resolveIdentifier(memberPath.node.object, SymbolFlags.Variable);
		} else if (memberPath.get("object").isMemberExpression()) {
			object = this._resolveMember(memberPath.get("object"));
		} else {
			/* istanbul ignore next */
			assert.fail(`Object for node path ${memberPath.node.object.type}`);
		}

		let member;
		if (object.hasMember(memberPath.node.property.name)) {
			member = object.getMember(memberPath.node.property.name);
		} else {
			member = new Symbol(memberPath.node.property.name, SymbolFlags.Property);
			object.addMember(member);
		}

		this.program.symbolTable.setSymbol(memberPath.node.property, member);
		this.program.symbolTable.setSymbol(memberPath.node.object, object);


		return member;
	}

	_declareObjectMember(path) {
		const object = this.program.symbolTable.getSymbol(path.parent);

		const name = path.node.key.name;
		let symbol;

		if (!object.hasMember(name)) {
			symbol = new Symbol(name, SymbolFlags.Property);
			object.addMember(symbol);
		} else {
			symbol = object.getMember(name);
		}

		symbol.declaration = path.node;
		this.program.symbolTable.setSymbol(path.node, symbol);
		return symbol;
	}
}

export default SymbolExtractor;