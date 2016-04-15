import {expect} from "chai";
import _ from "lodash";
import ControlFlowGraph, {BRANCHES} from "../../lib/cfg/control-flow-graph";
import Node from "../../lib/cfg/node";
import {Edge} from "../../lib/cfg/edge";

describe("ControlFlowGraph", () => {
	let cfg;

	beforeEach(() => {
		cfg = new ControlFlowGraph();
	});

	describe("createNode", () => {
		it("returns the created node", () => {
			expect(cfg.createNode("x")).to.be.instanceOf(Node);
		});

		it("returns the existing node if a node for the given value already exists", () => {
			// arrange
			const existing = cfg.createNode("x");

			// act
			const created = cfg.createNode("x");

			// assert
			expect(created).to.equal(existing);
		});
	});

	describe("getNode", () => {
		it("returns undefined if no node for the given value exists", () => {
			// act, assert
			expect(cfg.getNode("x")).to.be.undefined;
		});

		it("returns the node for the given value", () => {
			// arrange
			const node = cfg.createNode("x");

			// act
			const actual = cfg.getNode("x");

			// assert
			expect(actual).to.equal(node);
		});
	});

	describe("getNodes", () => {
		it("returns an empty iterator by default", () => {
			// act
			const nodes = cfg.getNodes();

			// assert
			expect(Array.from(nodes)).to.empty;
		});

		it("returns an iterator with the nodes for a non empty graph", () => {
			// arrange
			const x1 = cfg.createNode("x1");
			const x2 = cfg.createNode("x2");

			// act
			const nodes = cfg.getNodes();

			// assert
			expect(Array.from(nodes)).to.have.members([x1, x2]);
		});
	});

	describe("getNodesToExit", function () {
		it("returns all nodes from the passed in node to the exit node including the exit node", function () {
			// arrange
			const x = cfg.createNode("let x = 1;");
			const y = cfg.createNode("let y = 2");
			const result = cfg.createNode("let z = x + y");

			cfg.connectIfNotFound(x, BRANCHES.UNCONDITIONAL, y);
			cfg.connectIfNotFound(y, BRANCHES.UNCONDITIONAL, result);
			cfg.connectIfNotFound(result, BRANCHES.UNCONDITIONAL, null);

			// act
			const nodes = Array.from(cfg.getNodesToExit(y.value));

			// assert
			expect(nodes).to.deep.equal([y, result, cfg.getNode(null)]);
		});

		it("includes the nodes from different branches", function () {
			// arrange
			const x = cfg.createNode("let x = 1;");
			const ifNode = cfg.createNode("if (x > 0) {");
			const consequence = cfg.createNode("x = -x;");
			const alternative = cfg.createNode("x = x*x;");
			const result = cfg.createNode("let y = x*2");


			cfg.connectIfNotFound(x, BRANCHES.UNCONDITIONAL, ifNode);
			cfg.connectIfNotFound(ifNode, BRANCHES.TRUE, consequence);
			cfg.connectIfNotFound(ifNode, BRANCHES.FALSE, alternative);
			cfg.connectIfNotFound(consequence, BRANCHES.UNCONDITIONAL, result);
			cfg.connectIfNotFound(alternative, BRANCHES.UNCONDITIONAL, result);
			cfg.connectIfNotFound(result, BRANCHES.UNCONDITIONAL, null);

			// act
			const nodes = Array.from(cfg.getNodesToExit(ifNode.value));

			// assert
			expect(nodes).to.deep.equal([ifNode, consequence, result, cfg.getNode(null), alternative]);
		});

		it("ignores back links to already processed nodes", function () {
			// arrange
			const x = cfg.createNode("let x = 1;");
			const whileNode = cfg.createNode("while (x > 0) {");
			const whileBody = cfg.createNode("--x;");
			const result = cfg.createNode("let y = x*2");


			cfg.connectIfNotFound(x, BRANCHES.UNCONDITIONAL, whileNode);
			cfg.connectIfNotFound(whileNode, BRANCHES.TRUE, whileBody);
			cfg.connectIfNotFound(whileNode, BRANCHES.FALSE, result);
			cfg.connectIfNotFound(whileBody, BRANCHES.UNCONDITIONAL, whileNode);
			cfg.connectIfNotFound(result, BRANCHES.UNCONDITIONAL, null);

			// act
			const nodes = Array.from(cfg.getNodesToExit(whileNode.value));

			// assert
			expect(nodes).to.deep.equal([whileNode, whileBody, result, cfg.getNode(null)]);
		});
	});

	describe("getEdges", () => {
		it("returns an empty iterator by default", () => {
			// act
			const edges = cfg.getEdges();

			// assert
			expect(Array.from(edges)).to.be.empty;
		});

		it("returns all the edges in the graph", () => {
			// arrange
			const x1 = cfg.createNode("x1");
			const x2 = cfg.createNode("x2");

			cfg.connectIfNotFound(x1, "New", x2);
			cfg.connectIfNotFound(x2, "Reverse", x1);

			// act
			const edges = cfg.getEdges();

			// assert
			expect(Array.from(edges)).to.have.lengthOf(2);
		});
	});

	describe("getExitEdges", function () {
		it("returns the edges that are direct predecessors of the node with the null value", function () {
			// arrange
			const x1 = cfg.createNode("x1");
			const x2 = cfg.createNode("x2");

			cfg.connectIfNotFound(x1, "New", x2);
			cfg.connectIfNotFound(x2, "Exit", null);

			// act
			const exitEdges = Array.from(cfg.getExitEdges(x1));

			// assert
			expect(exitEdges).to.deep.equal(Array.from(x2.successors.values()));
		});

		it("detects and prevents cycles", function () {
			// arrange
			const x1 = cfg.createNode("x1");
			const x2 = cfg.createNode("x2");
			const x3 = cfg.createNode("x3");

			cfg.connectIfNotFound(x1, "New", x2);
			cfg.connectIfNotFound(x2, "Default", x3);
			cfg.connectIfNotFound(x3, "False", null);
			const expectedExitEdges = Array.from(x3.successors.values());
			cfg.connectIfNotFound(x3, "True", x1);

			// act
			const exitEdges = Array.from(cfg.getExitEdges(x1));

			// assert
			expect(exitEdges).to.deep.equal(expectedExitEdges);
		});
	});

	describe("connectIfNotFound", () => {
		let nodeA, nodeB;

		beforeEach(() => {
			nodeA = cfg.createNode("A");
			nodeB = cfg.createNode("B");
		});

		it("creates a connection between the two nodes if no connection did exist", () => {
			// act
			cfg.connectIfNotFound(nodeA, "T", nodeB);

			// assert
			expect(nodeB.isSuccessorOf(nodeA, "T")).to.be.true;
		});

		it("adds the edge to the successors of A and to the predecessors of B", () => {
			// act
			cfg.connectIfNotFound(nodeA, "T", nodeB);

			// assert
			const edge = _.first(Array.from(nodeA.successors));

			expect(edge).not.to.be.null;
			expect(edge).to.equal(_.first(Array.from(nodeB.predecessors)));
		});

		it("does not create a connection between two nodes if the same connection already exists", () => {
			// arrange
			cfg.connectIfNotFound(nodeA, "T", nodeB);

			// act
			cfg.connectIfNotFound(nodeA, "T", nodeB);

			// assert
			expect(nodeA.successors.size).to.equal(1);
			expect(nodeB.predecessors.size).to.equal(1);
		});

		it("looks up the nodes if a value is passed and not a graph node", () => {
			// act
			cfg.connectIfNotFound("A", "T", "B");

			// assert
			expect(cfg.isConnected(nodeA, nodeB, "T")).to.be.true;
		});

		it("creates new nodes when the node for a passed in value does not yet exist", () => {
			// act
			cfg.connectIfNotFound("X", "T", "Y");

			// assert
			expect(cfg.isConnected("X", "Y", "T")).to.be.true;
		});
	});

	describe("isConnected", () => {
		let nodeA, nodeB;

		beforeEach(() => {
			nodeA = cfg.createNode("A");
			nodeB = cfg.createNode("B");
		});

		it("returns false if no connection between the two nodes exist", () => {
			expect(cfg.isConnected(nodeA, nodeB)).to.be.false;
		});

		it("returns true if a connection between the passed in nodes exist", () => {
			// arrange
			const edge = new Edge(nodeA, "T", nodeB);
			nodeA.successors.add(edge);
			nodeB.predecessors.add(edge);

			// asssert, act
			expect(cfg.isConnected(nodeA, nodeB)).to.be.true;
		});

		it("returns true if the connection with the same label exists", () => {
			// arrange
			const edge = new Edge(nodeA, "T", nodeB);
			nodeA.successors.add(edge);
			nodeB.predecessors.add(edge);

			// asssert, act
			expect(cfg.isConnected(nodeA, nodeB, "T")).to.be.true;
		});

		it("returns false if the connection has another branch label", () => {
			// arrange
			const edge = new Edge(nodeA, "T", nodeB);
			nodeA.successors.add(edge);
			nodeB.predecessors.add(edge);

			// asssert, act
			expect(cfg.isConnected(nodeA, nodeB, "C")).to.be.false;
		});

		it("returns false if the connection is in the reverse direction", () => {
			// arrange
			const edge = new Edge(nodeA, "T", nodeB);
			nodeA.predecessors.add(edge);
			nodeB.successors.add(edge);

			// asssert, act
			expect(cfg.isConnected(nodeA, nodeB, "T")).to.be.false;
		});
	});
});