import {expect} from "chai";
import SourceFile from "../../lib/semantic-model/source-file";
import Scope from "../../lib/semantic-model/scope";

describe("SourceFile", function () {

	let sourceFile;
	let globalScope;

	beforeEach(function () {
		globalScope = new Scope();
		sourceFile = new SourceFile("source-file.specs.js", "let x = 10;", globalScope);
	});

	describe("scope", function () {
		it("has it's own scope that has the global scope as it's parent", function () {
			// assert
			expect(sourceFile.scope).not.to.equal(globalScope);
			expect(sourceFile.scope).to.have.property("parent").that.equals(globalScope);
		});
	});

	describe("parse", function () {
		it("parses the text of the source file and assigns the ast to the ast member", function () {
			// act
			sourceFile.parse();

			expect(sourceFile.ast).to.have.property("program");
		});

		it("can parse es6 modules", function () {
			// arrange
			sourceFile.text = "export const x = 10;";

			// act
			sourceFile.parse();

			// assert
			expect(sourceFile.ast).to.have.property("program");
		});

		it("includes the source filename in the loc", function () {
			// act
			sourceFile.parse();

			// assert
			expect(sourceFile.ast.program.loc).to.have.property("filename").that.equals("source-file.specs.js");
		});
	});
});