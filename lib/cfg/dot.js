import * as graphviz from "graphviz";
import * as t from "babel-types";
import * as _ from "lodash";

import generate from "babel-generator";

function stableEdgeComparator(x, y) {
	const comparedBySrc = stableNodeComparator(x.src, y.src);

	if (comparedBySrc === 0) {
		return stableNodeComparator(x.to, y.to);
	}

	return comparedBySrc;
}

function stableNodeComparator (x, y) {
	if (!x.value) {
		return 1;
	}
	if (!y.value) {
		return -1;
	}

	if (x.value.loc.start.line === y.value.loc.start.line) {
		return x.value.loc.start.column - y.value.loc.start.column;
	}

	return x.value.loc.start.line - y.value.loc.start.line;
}

/**
 * Generates a single line label for a statement by  using the code representation of the node but without any
 * child nodes.
 * @param node the node for which the label should be generated
 * @returns {string} a label for this node
 */
function createLabelForNode(node) {
	let label;

	function codeFor (node) {
		const { code } = generate(node, {
			retainLines: false,
			comments: false,
			quotes: "double"
		});

		let result = code.replace(/"/g, "\\\"");

		if (_.endsWith(result, ";")) {
			result =result.substring(0, result.length - 1);
		}
		return result;
	}

	if (!node ) {
		return "EOF";
	}

	if (t.isIfStatement(node)) {
		label = `if (${codeFor(node.test)})`;
	} else if (t.isWhileStatement(node)) {
		label = `while (${codeFor(node.test)})`;
	} else if (t.isForStatement(node)) {
		label = `for (${codeFor(node.init)}, ${codeFor(node.test)}, ${codeFor(node.update)})`;
	} else if (t.isForInStatement(node)) {
		label = `for (${codeFor(node.left)} in ${codeFor(node.right)})`;
	} else if (t.isForOfStatement(node)) {
		label = `for (${codeFor(node.left)} of ${codeFor(node.right)})`;
	} else if (t.isDoWhileStatement(node)) {
		label = `do ... while(${codeFor(node.test)})`;
	} else if (t.isSwitchStatement(node)) {
		label = `switch (${codeFor(node.discriminant)})`;
	} else if (t.isSwitchCase(node)) {
		if (node.test) {
			label = `case ${codeFor(node.test)}:`;
		} else {
			label = "default:";
		}
	} else if (t.isFunction(node)) {
		const params = node.params.map(param => codeFor(param)).join(", ");
		const name = node.id ? node.id.name : node.key ? node.key.name : "anonymous";
		label = `function ${name} (${params})`;
	} else if (t.isBlockStatement(node)) {
		if (node.body.length === 0) {
			label = "{}";
		} else {
			label = "{ ... }";
		}
	} else {
		label = codeFor(node);
	}

	const lineOfCode = node ? node.loc.start.line : "";

	return `${lineOfCode} ${label}`;
}

function setStyleAttributes (graph) {
	graph.setNodeAttribut("fontname", "Verdana");
	graph.setNodeAttribut("fontsize", 10);
	graph.setNodeAttribut("style", "filled");
	graph.setNodeAttribut("fillcolor", "#EEEEEE");
	graph.setNodeAttribut("color", "#EEEEEE");

	graph.setEdgeAttribut("color", "#31CEF0");
	graph.setEdgeAttribut("fontname", "Verdana");
	graph.setEdgeAttribut("fontsize", 8);
}

function createGraphForCfg(cfg, options) {
	const graph = graphviz.digraph("cfg");
	const nodeCache = new Map();

	plotNodes();
	plotEdges();

	return graph;

	function plotNodes () {
		for (const node of sortNodes(cfg.getNodes())) {
			const label = createLabelForNode(node.value);
			const graphvizNode = graph.addNode(nodeCache.size.toString(), {label: label});
			nodeCache.set(node, graphvizNode);
		}
	}

	function plotEdges() {
		for (const edge of sortEdges(cfg.getEdges())) {
			const predecessorNode = nodeCache.get(edge.src);
			const successorNode = nodeCache.get(edge.to);
			// console.log(`${edge.src.value.loc.start.line} -> ${edge.to.value.loc.start.line}`);
			graph.addEdge(predecessorNode, successorNode, { label: edge.branch });
		}
	}

	function sortNodes (nodes) {
		if (options.stable) {
			return Array.from(nodes).sort(stableNodeComparator);
		}

		return nodes;
	}

	function sortEdges (edges) {
		if (options.stable) {
			return Array.from(edges).sort(stableEdgeComparator);
		}

		return edges;
	}
}

/**
 * Writes an image representation of the graph to the defined path
 * @param cfg {ControlFlowGraph} the control flow graph to plot
 * @param options {object?}
 * @param options.stable {boolean?} needs the output order of the node and edges to be stable
 * @param options.type {string?} the type of the image to create
 * @param options.path {string?} the target path for the image
 */
export function plotControlFlowGraph(cfg, options) {
	options = _.defaults(options, { type: "png", path: "graph.png" });

	const graph = createGraphForCfg(cfg, options);
	setStyleAttributes(graph);
	graph.render(options.type, options.path);
}

/**
 * Returns a dot representation of the control flow graph
 * @param cfg {ControlFlowGraph} the control flow graph to plot
 * @param options {object?}
 * @param options.stable {boolean?} needs the output order of the node and edges to be stable
 * @returns {string} the dot representation of the graph
 */
export function cfgToDot(cfg, options) {
	options = options || {};
	return createGraphForCfg(cfg, options).to_dot().trim();
}