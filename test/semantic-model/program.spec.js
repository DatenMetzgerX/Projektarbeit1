import {expect} from "chai";

import Program from "../../lib/semantic-model/program";
import Scope from "../../lib/semantic-model/scope";
import SymbolTable from "../../lib/semantic-model/symbol-table";
import SourceFile from "../../lib/semantic-model/source-file";
import {ControlFlowGraph} from "../../lib/cfg/control-flow-graph";

describe("Program", function () {
	it("creates a global scope by default", function () {
		// arrange
		const program = new Program();

		// assert
		expect(program.globalScope).to.be.instanceOf(Scope);
	});

	it("creates a new symbol table", function () {
		// arrange
		const program = new Program();

		// assert
		expect(program.symbolTable).to.be.instanceOf(SymbolTable);
	});

	describe("getSourceFile", function () {
		it("returns the source file with the given name", function () {
			// arrange
			const program = new Program();
			const sourceFile = new SourceFile("program.specs.js", "let x = 10", program.globalScope);
			program.addSourceFile(sourceFile);

			// act
			expect(program.getSourceFile(sourceFile.path)).to.equal(sourceFile);
		});

		it("returns undefined if the program does not contain a source file with the given path", function () {
			// arrange
			const program = new Program();
			const sourceFile = new SourceFile("program.specs.js", "let x = 10", program.globalScope);
			program.addSourceFile(sourceFile);

			// act
			expect(program.getSourceFile("scope.specs.js")).to.be.undefined;
		});
	});

	describe("addSourceFile", function () {
		it("throws if a source file with the given name already exists", function () {
			// arrange
			const program = new Program();
			const sourceFile = new SourceFile("program.specs.js", "let x = 10", program.globalScope);
			program.addSourceFile(sourceFile);


			// act
			const file2 = new SourceFile("program.specs.js", "let x = 11", program.globalScope);
			expect(() => program.addSourceFile(file2)).to.throw;
		});
	});

	describe("sourceFiles", function () {
		it("returns an iterator over all source files that are part of the program", function () {
			// arrange
			const program = new Program();
			const sourceFile = new SourceFile(".program.specs.js", "let x = 10", program.globalScope);
			program.addSourceFile(sourceFile);

			// act
			expect(Array.from(program.sourceFiles)).to.deep.equal([sourceFile]);
		});

		it("returns an empty iterator if the program contains no source files", function () {
			// arrange
			const program = new Program();

			// act
			expect(Array.from(program.sourceFiles)).to.be.empty;
		});
	});

	describe("createSourceFile", function () {
		it("creates a new source file from the given parameters", function () {
			// arrange
			const program = new Program();

			// act
			const createdSourceFile = program.createSourceFile("program.specs.js", "let x = 10");

			// assert
			expect(createdSourceFile).to.be.instanceOf(SourceFile);
			expect(createdSourceFile.path).to.equal("program.specs.js");
			expect(createdSourceFile.text).to.equal("let x = 10");
		});

		it("adds the source file to the list of sourcefiles of the program.", function () {
			// arrange
			const program = new Program();

			// act
			const createdSourceFile = program.createSourceFile("program.specs.js", "let x = 10");

			// assert
			expect(program.getSourceFile("program.specs.js")).to.equal(createdSourceFile);
		});
	});

	describe("getCfg", function () {
		it("returns the CFG of the sourcefile to which the ast node belongs to", function () {
			// arrange
			const program = new Program();
			const sourceFile = program.createSourceFile("./test/program.specs", "let x = 10;");
			sourceFile.parse();
			sourceFile.ast.cfg = new ControlFlowGraph();

			// act, assert
			expect(program.getCfg(sourceFile.ast.program)).to.equal(sourceFile.ast.cfg);
		});
	});
});