import traverse from "babel-traverse";
import successorPath from "./successor";
import ControlFlowGraph, {BRANCHES} from "./control-flow-graph";

function successor (from) {
	const p = successorPath(from);
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
			this.cfg.connectIfNotFound(blockGraphNode, BRANCHES.UNCONDITIONAL, path.node.body[0]);
		} else {
			this.cfg.connectIfNotFound(blockGraphNode, BRANCHES.UNCONDITIONAL, successor(path));
		}
	},

	IfStatement: function (path) {
		const ifGraphNode = this.cfg.createNode(path.node);
		this.cfg.connectIfNotFound(ifGraphNode, BRANCHES.TRUE, path.node.consequent);

		if (path.node.alternate) {
			this.cfg.connectIfNotFound(ifGraphNode, BRANCHES.FALSE, path.node.alternate);
		} else {
			this.cfg.connectIfNotFound(ifGraphNode, BRANCHES.FALSE, successor(path));
		}
	},

	WhileStatement: function (path) {
		const whileGraphNode = this.cfg.createNode(path.node);
		this.cfg.connectIfNotFound(whileGraphNode, BRANCHES.TRUE, path.node.body);
		this.cfg.connectIfNotFound(whileGraphNode, BRANCHES.FALSE, successor(path));
	},

	ForStatement: function (path) {
		// for (init; condition; update) { body };
		const forGraphNode = this.cfg.createNode(path.node);
		this.cfg.connectIfNotFound(path.node.init, BRANCHES.UNCONDITIONAL, forGraphNode);
		this.cfg.connectIfNotFound(forGraphNode, BRANCHES.FALSE, successor(path));
		this.cfg.connectIfNotFound(forGraphNode, BRANCHES.TRUE, path.node.body);
		this.cfg.connectIfNotFound(path.node.update, BRANCHES.UNCONDITIONAL, forGraphNode);
	}
};

export function createControlFlowGraph(ast) {
	const cfg = new ControlFlowGraph();

	traverse(ast, cfgVisitor, null, { cfg: cfg });
	return cfg;
}

export default createControlFlowGraph;