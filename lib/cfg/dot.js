import * as graphviz from "graphviz";
import * as _ from "lodash";
import {createLabelForNode} from "../util";

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
 * @param {ControlFlowGraph} cfg the control flow graph to plot
 * @param {object} [options]
 * @param {boolean} [options.stable=true] needs the output order of the node and edges to be stable
 * @param {string} [options.type=png] the type of the image to create
 * @param {string} [options.path=graph.png] the target path for the image
 */
export function plotControlFlowGraph(cfg, options) {
	options = _.defaults(options, { type: "png", path: "graph.png" });

	const graph = createGraphForCfg(cfg, options);
	setStyleAttributes(graph);
	graph.render(options.type, options.path);
}

/**
 * Returns a dot representation of the control flow graph
 * @param {!ControlFlowGraph} cfg the control flow graph to plot
 * @param {object} [options]
 * @param {boolean} [options.stable=false] needs the output order of the node and edges to be stable
 * @returns {string} the dot representation of the graph
 */
export function cfgToDot(cfg, options) {
	options = options || {};
	return createGraphForCfg(cfg, options).to_dot().trim();
}