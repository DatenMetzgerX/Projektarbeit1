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
	}
};

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