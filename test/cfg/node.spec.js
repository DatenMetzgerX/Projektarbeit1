import {expect} from "chai";
import Node from "../../lib/cfg/node";
import Edge from "../../lib/cfg/edge";

describe("Node", () => {
	describe("constructor", () => {
		it("has an empty successor and predecessor set by default", () => {
			// act
			const node = new Node("x");

			// assert
			expect(node.predecessors.size).to.equal(0);
			expect(node.successors.size).to.equal(0);
		});

		it("stores the value", () => {
			// act
			const node = new Node("x");

			// assert
			expect(node).to.have.property("value").that.is.equal("x");
		});
	});

	describe("isSuccessorOf", () => {
		let nodeA, nodeB;
		beforeEach(() => {
			nodeA = new Node("A");
			nodeB = new Node("B");
		});

		it("returns false when nodes have no common edge", () => {
			expect(nodeA.isSuccessorOf(nodeB)).to.be.false;
		});

		it("returns true when the graph node is a successor and the Branch type matches", () => {
			// arrange
			nodeA.successors.add(new Edge(nodeA, "T", nodeB));

			// act, assert
			expect(nodeB.isSuccessorOf(nodeA, "T")).to.be.true;
		});

		it("returns false when the graph node is a successor but the branch type doesn't match", () => {
			// arrange
			nodeA.successors.add(new Edge(nodeA, "T", nodeB));

			// act, assert
			expect(nodeB.isSuccessorOf(nodeA, "F")).to.be.false;
		});

		it("returns true for predecessor when the function is called without a branch type", () => {
			// arrange
			nodeA.successors.add(new Edge(nodeA, "F", nodeB));

			// act, assert
			expect(nodeB.isSuccessorOf(nodeA)).to.be.true;
		});

		it("returns false when the nodes have an edge but in the opposite direction", () => {
			// arrange
			nodeB.successors.add(new Edge(nodeB, "F", nodeA));

			// act, assert
			expect(nodeB.isSuccessorOf(nodeA)).to.be.false;
		});
	});
});