import {createTraverseVisitorWrapper} from "../lib/util";
import sinon from "sinon";
import traverse, {NodePath} from "babel-traverse";
import {parse} from "babylon";
import {expect} from "chai";

describe("util", function () {
	describe("createTraverseVisitorWrapper", function () {
		let ast;

		beforeEach(function () {
			ast = parse(`
			let x, y;
			x = 10;
			`);
		});


		it("calls the enter callback for a node", function () {
			// arrange
			const visitorObject = {
				enterVariableDeclaration: sinon.spy(),
				enterExpressionStatement: sinon.spy(),
				defaultHandler: sinon.spy()
			};

			const wrapper = createTraverseVisitorWrapper(visitorObject);

			// act
			traverse(ast, wrapper);

			// assert
			sinon.assert.called(visitorObject.enterVariableDeclaration);
		});

		it("passes the path to the handler", function () {
			// arrange
			const visitorObject = {
				enterVariableDeclaration: sinon.spy(),
				enterExpressionStatement: sinon.spy(),
				defaultHandler: sinon.spy()
			};

			const wrapper = createTraverseVisitorWrapper(visitorObject);

			// act
			traverse(ast, wrapper);

			// assert
			sinon.assert.calledWith(visitorObject.enterVariableDeclaration, sinon.match.instanceOf(NodePath));
		});

		it("passes the context to the handler", function () {
			// arrange
			const visitorObject = {
				enterVariableDeclaration: sinon.spy(),
				enterExpressionStatement: sinon.spy(),
				defaultHandler: sinon.spy()
			};

			const wrapper = createTraverseVisitorWrapper(visitorObject);

			// act
			traverse(ast, wrapper, null, {});

			// assert
			sinon.assert.calledWith(visitorObject.enterVariableDeclaration, sinon.match.instanceOf(NodePath), sinon.match.object);
		});

		it("ensures that this stays the same", function () {
			// arrange
			const visitorObject = {
				enterVariableDeclaration: sinon.spy(),
				enterExpressionStatement: sinon.spy(),
				defaultHandler: sinon.spy()
			};

			const wrapper = createTraverseVisitorWrapper(visitorObject);

			// act
			traverse(ast, wrapper, null, {});

			// assert
			expect(visitorObject.enterVariableDeclaration.thisValues[0]).to.equal(visitorObject);
		});

		it("registers the exit handler if the object has an exit handler", function () {
			// arrange
			const visitorObject = {
				enterVariableDeclaration: sinon.spy(),
				exitVariableDeclaration: sinon.spy(),
				enterExpressionStatement: sinon.spy(),
				defaultHandler: sinon.spy()
			};

			const wrapper = createTraverseVisitorWrapper(visitorObject);

			// act
			traverse(ast, wrapper);

			// assert
			sinon.assert.called(visitorObject.exitVariableDeclaration);
			sinon.assert.called(visitorObject.enterVariableDeclaration);
		});

		it("calls the default callback if no specific handler exists", function () {
			// arrange
			const visitorObject = {
				enterVariableDeclaration: sinon.spy(),
				defaultHandler: sinon.spy()
			};

			const wrapper = createTraverseVisitorWrapper(visitorObject);

			// act
			traverse(ast, wrapper);

			// assert
			sinon.assert.calledWith(visitorObject.defaultHandler, sinon.match.has("node", ast.program.body[1]));
		});

		it("throws when a visitor object has a public method that is not a node type", function () {
			// arrange
			const visitorObject = {
				enterVariableDeclaration: sinon.spy(),
				enterXYHandler: sinon.spy(),
				defaultHandler: sinon.spy()
			};

			// act, assert
			expect(() => createTraverseVisitorWrapper(visitorObject)).to.throw("AssertionError: 'Unknown Node type");
		});

		it("does not throw an error for private visitor functions prefixed with _", function () {
			// arrange
			const visitorObject = {
				enterVariableDeclaration: sinon.spy(),
				_helper: sinon.spy(),
				defaultHandler: sinon.spy()
			};

			// act, assert
			expect(() => createTraverseVisitorWrapper(visitorObject)).not.to.throw;
		});

		it("fails when the visitor does not have a default handler and a not handled node is traversed", function () {
			// arrange
			const visitorObject = {
				enterVariableDeclaration: sinon.spy()
			};

			const wrapper = createTraverseVisitorWrapper(visitorObject);

			// act, assert
			expect(() => traverse(ast, wrapper)).to.throw("AssertionError: 'Unhandled node type Program.'");
		});

	});
});