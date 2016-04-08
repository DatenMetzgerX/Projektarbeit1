import assert from "assert";
import * as _ from "lodash";
import computeSuccessor from "./successor";
import computeFallThrough from "./fallthrough";
import ControlFlowGraph, {BRANCHES} from "./control-flow-graph";

function fallThrough(to) {
	const p = computeFallThrough(to);
	return p ? p.node : null;
}

function successor (from) {
	const p = computeSuccessor(from);
	return p ? p.node : null;
}

/**
 * Determines if the passed in path (always a statement) might throws an exception at runtime.
 * The method does only check all expressions that are a direct child of this statement.
 * It does not check if the path contains any child statements that might throw an exception.
 * @param path {NodePath} the node path to verify
 * @returns {boolean} returns true if the evaluation of this statement might throw an exception.
 */
function mayThrowException(path) {
	assert(path.isStatement(), `The path with a node '${path.node.type}' needs to be a statement.`);

	// first check if the statement itself may throw an exception
	if (path.isThrowStatement()) {
		return true;
	}
	// declarations can never throw
	if (path.isFunction()) {
		return false;
	}

	let expressionThrows = false;

	// check if the path contains any direct sub expression that might throw;
	path.traverse({
		enter(expressionPath) {
			// if it is a statement, then it will have an exception connection itself, we do not need to consider this here.
			if (expressionPath.isStatement()) {
				expressionPath.stop();
			}

			// TODO #18 Assert May throw list is complete
			switch (expressionPath.node.type) {
			case "CallExpression":
			case "NewExpression":
			case "MemberExpression":
			case "TaggedTemplateExpression":
			case "AssignmentExpression":
			case "UpdateExpression":
			case "UnaryExpression":
				expressionThrows = true;
				expressionPath.stop();
			}
		}
	});

	return expressionThrows;
}

/**
 * Returns the next case statement that follows the passed in case statement while skipping default statements
 * until the default case is the last case. Case statements are evaluated in order, but the default statement is always evaluated last.
 * So it's required to skip any default cases as long as the switch statement has any more case statements.
 * @param {!NodePath} path the case statement path for which the following case statement should be determined
 * @returns {?NodePath} the node path of the following case or default case or null if the case is the last
 */
function getNextCase (path) {
	let nextCase = path.getSibling(path.key + 1);

	while (nextCase.node && !nextCase.node.test) {
		nextCase = nextCase.getSibling(nextCase.key + 1);
	}

	if (nextCase.node) {
		return nextCase.node;
	}

	// ok no more cases, search default case
	let defaultCase = path.getSibling(0);
	while (defaultCase.node && defaultCase.node.test) {
		defaultCase = defaultCase.getSibling(defaultCase.key + 1);
	}

	return defaultCase.node ? defaultCase.node : null;
}

/**
 * Returns the first consequent statement for the passed in case path.
 * @param {NodePath} casePath the case path for which the consequent statement should be determined.
 * @returns {?NodePath} If the case statement has no consequent statements
 * itself then the consequent statements of a following case are returned. If the case has neither a consequent statement
 * itself nor any following consequent statements, then null is returned
 */
function getConsequentForCase (casePath) {
	while (casePath.node && casePath.node.consequent.length === 0) {
		casePath = casePath.getSibling(casePath.key + 1);
	}

	if (casePath.node && casePath.node.consequent.length > 0) {
		return casePath.get("consequent")[0];
	}

	return null;
}

/**
 * AST Visitor that creates the control flow graph and assigns it to the root ast node.
 * The control flow graph is build on a statement basis, so it will only contain statements as nodes and not expressions.
 */
export class CfgBuilder {
	/**
	 * Creates a new analyzer that creates the cfg for the given ast
	 * @param ast the ast entry node
     */
	constructor(ast) {
		this.ast = ast;
		this.ast.cfg = new ControlFlowGraph(ast);
		this.exceptionHandlers = [];
	}

	get cfg() {
		return this.ast.cfg;
	}

	enterProgram (path) {
		this.exceptionHandlers.push(path);
	}

	//------------------------------------------
	// Statements
	//------------------------------------------
	enterEmptyStatement(path) {
		this._connectWithSuccessor(path);
	}

	enterBlockStatement (path) {
		const blockGraphNode = this.cfg.createNode(path.node);

		const statements = path.get("body");
		const firstStatement = _.find(statements, statement => !statement.isFunctionDeclaration());

		if (firstStatement) {
			this.cfg.connectIfNotFound(blockGraphNode, BRANCHES.UNCONDITIONAL, fallThrough(firstStatement));
		} else {
			this.cfg.connectIfNotFound(blockGraphNode, BRANCHES.UNCONDITIONAL, successor(path));
		}
	}

	enterExpressionStatement(path) {
		this._connectWithSuccessor(path);
	}

	enterIfStatement(path) {
		const ifGraphNode = this.cfg.createNode(path.node);
		this.cfg.connectIfNotFound(ifGraphNode, BRANCHES.TRUE, fallThrough(path.get("consequent")));

		if (path.node.alternate) {
			this.cfg.connectIfNotFound(ifGraphNode, BRANCHES.FALSE, fallThrough(path.get("alternate")));
		} else {
			this.cfg.connectIfNotFound(ifGraphNode, BRANCHES.FALSE, successor(path));
		}

		this._connectWithExceptionHandler(path);
	}

	/**
	 * A labeled statement can safely be ignored. The body is always a statement that than is
	 * handled. The label statement itself has no effect on the control flow
     */
	enterLabeledStatement() {}

	enterBreakStatement(path) {
		this._connectWithSuccessor(path);
	}

	enterContinueStatement(path) {
		this._connectWithSuccessor(path);
	}

	enterSwitchStatement(path) {
		const switchNode = this.cfg.createNode(path.node);

		if (path.node.cases.length > 0) {
			// the default case is the last case to test even when it isn't the 'case' statement in the code
			if (!path.node.cases[0].test && path.node.cases.length > 1) {
				this.cfg.connectIfNotFound(switchNode, BRANCHES.UNCONDITIONAL, fallThrough(path.get("cases")[1]));
			} else {
				this.cfg.connectIfNotFound(switchNode, BRANCHES.UNCONDITIONAL, fallThrough(path.get("cases")[0]));
			}
		} else {
			this.cfg.connectIfNotFound(switchNode, BRANCHES.UNCONDITIONAL, successor(path));
		}
		this._connectWithExceptionHandler(path);
	}

	enterReturnStatement(path) {
		// TODO #18 support continue, break and return statement inside of a try finally
		const tryCatch = path.findParent(parent => parent.isTryStatement());
		assert(!tryCatch ||!tryCatch.node.finalizer, "Return statements inside of a try statement with a finalizer are not supported");

		this.cfg.connectIfNotFound(path.node, BRANCHES.UNCONDITIONAL, null);
		this._connectWithExceptionHandler(path);
	}

	enterTryStatement(path) {
		this.cfg.connectIfNotFound(path.node, BRANCHES.UNCONDITIONAL, path.node.block);
		if (path.node.handler) {
			this.exceptionHandlers.push(path.get("handler"));
		}
	}

	enterWhileStatement(path) {
		this._loop(path);
	}

	enterDoWhileStatement(path) {
		this._loop(path);
	}

	enterForStatement(path) {
		// for (init; condition; update) { body };
		const forGraphNode = this.cfg.createNode(path.node);

		if (path.node.init) {
			this.cfg.connectIfNotFound(path.node.init, BRANCHES.UNCONDITIONAL, forGraphNode);
		}

		if (path.node.test) {
			this.cfg.connectIfNotFound(forGraphNode, BRANCHES.FALSE, successor(path));
		}

		if (path.node.update) {
			this.cfg.connectIfNotFound(path.node.update, BRANCHES.UNCONDITIONAL, forGraphNode);
		}

		this.cfg.connectIfNotFound(forGraphNode, BRANCHES.TRUE, fallThrough(path.get("body")));
		this._connectWithExceptionHandler(path);
	}

	enterForInStatement(path) {
		this._loop(path);
	}

	enterForOfStatement(path) {
		this._loop(path);
	}

	//------------------------------------------
	// Declarations
	//------------------------------------------

	enterVariableDeclaration (path) {
		// variable declarations might be a statement or part of another statement like for in or for loop
		// in this case we do not want to create a separate node as the declaration is handled in the loop
		if (path.isStatement()) {
			this._connectWithSuccessor(path);
		}
	}

	enterFunctionDeclaration(path) {
		this.exceptionHandlers.push(path);
		this.cfg.connectIfNotFound(path.node, BRANCHES.UNCONDITIONAL, path.node.body);
	}

	exitFunctionDeclaration(path) {
		assert(_.last(this.exceptionHandlers) === path);
		this.exceptionHandlers.pop();
	}

	//------------------------------------------
	// Clauses
	//------------------------------------------

	enterCatchClause (path) {
		this.cfg.connectIfNotFound(path.node, BRANCHES.UNCONDITIONAL, path.node.body);

		// as soon as we are inside of the catch block, another exception handler is responsible for any occurring exceptions
		assert(_.last(this.exceptionHandlers) === path);
		this.exceptionHandlers.pop();
	}

	enterSwitchCase(path) {
		const caseNode = this.cfg.createNode(path.node);
		const consequent = getConsequentForCase(path);
		let trueBranch = consequent ? fallThrough(consequent) : successor(path.parentPath);

		// case x:
		if (path.node.test) {
			this.cfg.connectIfNotFound(caseNode, BRANCHES.TRUE, trueBranch);

			const nextCase = getNextCase(path);
			if (nextCase) {
				this.cfg.connectIfNotFound(caseNode, BRANCHES.FALSE, nextCase);
			} else {
				this.cfg.connectIfNotFound(caseNode, BRANCHES.FALSE, successor(path.parentPath));
			}
		} else { // default
			this.cfg.connectIfNotFound(caseNode, BRANCHES.UNCONDITIONAL, trueBranch);
		}
	}

	//------------------------------------------
	// Non ES Tree Functions
	//------------------------------------------

	defaultHandler(path) {
		assert(!path.isStatement(), `Unhandled statement of type ${path.node.type}.`);
	}

	_connectWithSuccessor(path) {
		this.cfg.connectIfNotFound(path.node, BRANCHES.UNCONDITIONAL, successor(path));
		this._connectWithExceptionHandler(path);
	}

	_connectWithExceptionHandler(path) {
		if (mayThrowException(path) && _.last(this.exceptionHandlers).isCatchClause()) {
			this.cfg.connectIfNotFound(path.node, BRANCHES.EXCEPTION, _.last(this.exceptionHandlers).node);
		}
	}

	_loop(path) {
		const loopNode = this.cfg.createNode(path.node);

		this.cfg.connectIfNotFound(loopNode, BRANCHES.TRUE, fallThrough(path.get("body")));
		this.cfg.connectIfNotFound(loopNode, BRANCHES.FALSE, successor(path));
		this._connectWithExceptionHandler(path);
	}
}

export default CfgBuilder;