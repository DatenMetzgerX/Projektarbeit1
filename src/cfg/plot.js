import * as graphviz from "graphviz";
import * as t from "babel-types";

import generate from "babel-generator";

function createLabelForNode(node) {
	let label;

	function codeFor (node) {
		const { code } = generate(node, {
			retainLines: false,
			comments: false,
			quotes: "double"
		});

		return code.replace(/"/g, "\\\"");
	}

	if (!node ) {
		label = "EOF";
	} else if (t.isIfStatement(node)) {
		label = `if (${codeFor(node.test)})`;
	} else if (t.isWhileStatement(node)) {
		label = `while (${codeFor(node.test)})`;
	} else if (t.isForStatement(node)) {
		label = `for (${codeFor(node.init)}, ${codeFor(node.test)}, ${codeFor(node.update)})`;
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

function createGraph() {
	const graph = graphviz.digraph();

	graph.setNodeAttribut("fontname", "Verdana");
	graph.setNodeAttribut("fontsize", 10);
	graph.setNodeAttribut("style", "filled");
	graph.setNodeAttribut("fillcolor", "#EEEEEE");
	graph.setNodeAttribut("color", "#EEEEEE");

	graph.setEdgeAttribut("color", "#31CEF0");
	graph.setEdgeAttribut("fontname", "Verdana");
	graph.setEdgeAttribut("fontsize", 8);
	return graph;
}

export function plot(cfg) {
	const graph = createGraph();
	const graphvizNodes = new Map();
	let i = 0;

	function getOrCreateGraphvizNode(graphNode) {
		const existing = graphvizNodes.get(graphNode);
		if (!existing) {
			const label = createLabelForNode(graphNode.value);
			let node = graph.addNode(++i, {label: label});
			graphvizNodes.set(graphNode, node);
			return node;
		}
		return existing;
	}

	for (const node of cfg.getNodes()) {
		const graphvizNode = getOrCreateGraphvizNode(node);
		graphvizNodes.set(node, graphvizNode);

		for (const successor of node.successors) {
			const successorGraphvizNode = getOrCreateGraphvizNode(successor.to);

			graph.addEdge(graphvizNode, successorGraphvizNode, { label: successor.branch });
		}
	}

	graph.output("png", "graph.png");
}

export default plot;