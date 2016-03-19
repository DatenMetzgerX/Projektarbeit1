import {expect} from "chai";
import Edge from "../../lib/cfg/edge";
import Node from "../../lib/cfg/node";

describe("Edge", () => {
	describe("constructor", () => {
		it("throws if to or from are null", () => {
			expect(() => new Edge(null, "T", new Node("x"))).to.throw();
			expect(() => new Edge(new Node("x"), "T", null)).to.throw();
			expect(() => new Edge(null, "T", null)).to.throw();
		});

		it("throws when to or from are not an instance of GraphNode", () => {
			expect(() => new Edge("y", "T", new Node("x"))).to.throw();
			expect(() => new Edge(new Node("x"), "T", "y")).to.throw();
			expect(() => new Edge("x", "T", "y")).to.throw();
		});

		it("assigns the passed in arguments to the instance", () => {
			// arrange
			const fromNode = new Node("from");
			const toNode = new Node("to");

			// act
			const edge = new Edge(fromNode, "Cond", toNode);

			// assert
			expect(edge).to.have.property("src").that.is.equal(fromNode);
			expect(edge).to.have.property("to").that.is.equal(toNode);
			expect(edge).to.have.property("branch").that.is.equal("Cond");
		});
	});
});