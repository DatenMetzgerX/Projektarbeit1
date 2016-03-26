import {expect} from "chai";
import traverse from "babel-traverse";
import {parse} from "babylon";

import {Scope} from "../../lib/semantic-model/scope";
import {SymbolExtractor} from "../../lib/semantic-model/symbol-extractor";

describe("SymbolExtractor", function () {
	let globalScope;

	beforeEach(function () {
		globalScope = new Scope(null);
	});

	describe("Block", function () {
		it("assigns the scope to the node's scope property", function () {
			// act
			const ast = extractSymbols("let x");

			// assert
			expect(ast.program.scope).not.to.be.undefined;
		});

		it("creates a new scope for a new block", function () {
			// act
			const ast = extractSymbols(`
				{
					let z = 10;
				}
			`);

			// assert
			const programScope = ast.program.scope;
			const blockScope = ast.program.body[0].scope;

			expect(blockScope).not.to.be.undefined.and.not.to.equal(programScope);
		});
	});

	describe("VariableDeclarator", function () {
		it("creates a symbol in the current scope for a declared variable", function () {
			// act
			const ast = extractSymbols("let x = 10");

			// assert
			const scope = ast.program.scope;
			expect(scope.resolveSymbol("x")).to.have.property("name").that.equals("x");
		});

		it("sets the declarator node as declaration of the symbol", function () {
			// act
			const ast = extractSymbols("let x = 10");

			// assert
			const scope = ast.program.scope;
			expect(scope.resolveSymbol("x")).to.have.property("declaration").that.equals(ast.program.body[0].declarations[0]);
		});

		it("sets the value declaration of the symbol if the value is initialized in the declarator", function () {
			// act
			const ast = extractSymbols("let x = 10");

			// assert
			const scope = ast.program.scope;
			expect(scope.resolveSymbol("x")).to.have.property("valueDeclaration").that.equals(ast.program.body[0].declarations[0].init);
		});
	});

	describe("AssignmentExpression", function () {
		it("adds a member to the symbol to which the member is assigned for a member assignment expression", function () {
			// act
			const ast = extractSymbols(`
				let x = 12;
				x.y = 12;
			`);

			// assert
			const x = ast.program.scope.resolveSymbol("x");
			const y = x.getMember("y");

			expect(y).to.have.property("name").that.equals("y");
		});

		it("adds a member to the symbol of the nearest parent symbol for an assignment expression", function () {
			// act
			const ast = extractSymbols(`
				let x = {};
				x.y = {};
				x.y.z = 10;
			`);

			// assert
			const x = ast.program.scope.resolveSymbol("x");
			const y = x.getMember("y");
			const z = y.getMember("z");

			expect(z).to.have.property("name").that.equals("z");
		});

		it("adds unknown intermediate members", function () {
			// act
			const ast = extractSymbols(`
				let x = {};
				x.y.z = 10;
			`);

			// assert
			const x = ast.program.scope.resolveSymbol("x");
			const y = x.getMember("y");
			const z = y.getMember("z");

			expect(z).to.have.property("name").that.equals("z");
		});

		it("can handle access to not yet declared identifiers", function () {
			// act
			const ast = extractSymbols(`
				x.y = 10;
				var x;
			`);

			// assert
			const x = ast.program.scope.resolveSymbol("x");
			const y = x.getMember("y");

			expect(y).to.have.property("name").that.equals("y");
		});

		it("creates a symbol for assigned variables", function () {
			// act
			const ast = extractSymbols(`
				x = 10;
			`);

			// assert
			const x = ast.program.scope.resolveSymbol("x");

			expect(x).to.have.property("name").that.equals("x");
			expect(x).to.have.property("declaration").that.is.null;
		});
	});

	function extractSymbols(source) {
		const ast = parse(source);

		const symbolExtractor = new SymbolExtractor(globalScope);
		traverse(ast, symbolExtractor.visitor, null, symbolExtractor.state);
		return ast;
	}
});
