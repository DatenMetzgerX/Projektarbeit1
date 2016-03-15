import {assert} from "chai";
import Node from "../../src/cfg/node";
import Edge from "../../src/cfg/edge";

describe("Node", () => {
	describe("constructor", () => {
		it("has an empty successor and predecessor set by default", () => {
			// act
			const node = new Node("x");

			// assert
			assert.equal(node.predecessors.size, 0);
			assert.equal(node.successors.size, 0);
		});

		it("stores the value", () => {
			// act
			const node = new Node("x");

			// assert
			assert.equal(node.value, "x");
		});
	});

	describe("isSuccessorOf", () => {
		let nodeA, nodeB;
		beforeEach(() => {
			nodeA = new Node("A");
			nodeB = new Node("B");
		});

		it("returns false when nodes have no common edge", () => {
			assert.isFalse(nodeA.isSuccessorOf(nodeB));
		});

		it("returns true when the graph node is a successor and the Branch type matches", () => {
			// arrange
			nodeA.successors.add(new Edge(nodeA, "T", nodeB));

			// act, assert
			assert.isTrue(nodeB.isSuccessorOf(nodeA, "T"));
		});

		it("returns false when the graph node is a successor but the branch type doesn't match", () => {
			// arrange
			nodeA.successors.add(new Edge(nodeA, "T", nodeB));

			// act, assert
			assert.isFalse(nodeB.isSuccessorOf(nodeA, "F"));
		});

		it("returns true for predecessor when the function is called without a branch type", () => {
			// arrange
			nodeA.successors.add(new Edge(nodeA, "F", nodeB));

			// act, assert
			assert.isTrue(nodeB.isSuccessorOf(nodeA));
		});

		it("returns false when the nodes have an edge but in the opposite direction", () => {
			// arrange
			nodeB.successors.add(new Edge(nodeB, "F", nodeA));

			// act, assert
			assert.isFalse(nodeB.isSuccessorOf(nodeA));
		});
	});
});