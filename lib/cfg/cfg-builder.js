import traverse from "babel-traverse";
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

const cfgVisitor = {
	Statement: function (path) {
		if (path.isExpressionStatement() || path.isVariableDeclaration() || path.isEmptyStatement() || path.isBreakStatement() || path.isContinueStatement()) {
			this.cfg.connectIfNotFound(path.node, BRANCHES.UNCONDITIONAL, successor(path));
		}

		if (path.isForInStatement() || path.isForOfStatement() || path.isDoWhileStatement()) {
			const loopNode = this.cfg.createNode(path.node);

			this.cfg.connectIfNotFound(loopNode, BRANCHES.TRUE, fallThrough(path.get("body")));
			this.cfg.connectIfNotFound(loopNode, BRANCHES.FALSE, successor(path));
		}
	},

	BlockStatement: function (path) {
		const blockGraphNode = this.cfg.createNode(path.node);
		if (path.node.body.length > 0) {
			this.cfg.connectIfNotFound(blockGraphNode, BRANCHES.UNCONDITIONAL, fallThrough(path.get("body")[0]));
		} else {
			this.cfg.connectIfNotFound(blockGraphNode, BRANCHES.UNCONDITIONAL, successor(path));
		}
	},

	IfStatement: function (path) {
		const ifGraphNode = this.cfg.createNode(path.node);
		this.cfg.connectIfNotFound(ifGraphNode, BRANCHES.TRUE, fallThrough(path.get("consequent")));

		if (path.node.alternate) {
			this.cfg.connectIfNotFound(ifGraphNode, BRANCHES.FALSE, fallThrough(path.get("alternate")));
		} else {
			this.cfg.connectIfNotFound(ifGraphNode, BRANCHES.FALSE, successor(path));
		}
	},

	WhileStatement: function (path) {
		const whileGraphNode = this.cfg.createNode(path.node);
		this.cfg.connectIfNotFound(whileGraphNode, BRANCHES.TRUE, fallThrough(path.get("body")));
		this.cfg.connectIfNotFound(whileGraphNode, BRANCHES.FALSE, successor(path));
	},

	ForStatement: function (path) {
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
	},

	SwitchStatement: function (path) {
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
	},

	SwitchCase: function (path) {
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
};

/**
 * Returns the next case statement that follows the passed in case statement while skipping default statements
 * until the default case is the last case. Case statements are evaluated in order, but the default statement is always evaluated last.
 * So it's required to skip any default cases as long as the switch statement has any more case statements.
 * @param path {NodePath} the case statement path for which the following case statement should be determined
 * @returns {NodePath} the node path of the following case or default case or null if the case is the last
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
 * @param casePath the case path for which the consequent statement should be determined.
 * @returns {NodePath} If the case statement has no consequent statements
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
 * Creates a controll flow graph for the passed in ast
 * @param ast an ast created by babylon
 * @returns {ControlFlowGraph} the created control flow graph for the passed in ast
 */
export function createControlFlowGraph(ast) {
	const cfg = new ControlFlowGraph();

	traverse(ast, cfgVisitor, null, { cfg: cfg });
	return cfg;
}

export default createControlFlowGraph;