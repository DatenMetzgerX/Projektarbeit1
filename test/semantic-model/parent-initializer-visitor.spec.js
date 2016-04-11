import {parse} from "babylon";
import traverse from "babel-traverse";
import {expect} from "chai";
import ParentInitializerVisitor from "../../lib/semantic-model/parent-initializer-visitor";

describe("ParentInitializerVisitor", function () {
	it("sets the parent for each node", function () {
		// arrange
		const ast = parse(`
			function Square(length, width) {
		        this.length = length;
		        this.width = width;
			}`);
		
		// act
		traverse(ast, ParentInitializerVisitor);

		// assert
		expect(ast.parent).to.be.undefined;
		expect(ast.program.parent).to.equal(ast);
		expect(ast.program.body[0].parent).to.equal(ast.program);
	});
});