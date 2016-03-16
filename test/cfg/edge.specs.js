import {assert} from "chai";
import Edge from "../../lib/cfg/edge";
import Node from "../../lib/cfg/node";

describe("Edge", () => {
	describe("constructor", () => {
		it("throws if to or from are null", () => {
			assert.throws(() => new Edge(null, "T", new Node("x")));
			assert.throws(() => new Edge(new Node("x"), "T", null));
			assert.throws(() => new Edge(null, "T", null));
		});

		it("throws when to or from are not an instance of GraphNode", () => {
			assert.throws(() => new Edge("y", "T", new Node("x")));
			assert.throws(() => new Edge(new Node("x"), "T", "y"));
			assert.throws(() => new Edge("x", "T", "y"));
		});

		it("assigns the passed in arguments to the instance", () => {
			// arrange
			const fromNode = new Node("from");
			const toNode = new Node("to");

			// act
			const edge = new Edge(fromNode, "Cond", toNode);

			// assert
			assert.equal(edge.src, fromNode);
			assert.equal(edge.to, toNode);
			assert.equal(edge.branch, "Cond");
		});
	});
});