import fs from "fs";
import {expect} from "chai";
import glob from "glob";
import path from "path";

import {cfgToDot} from "../../lib/cfg/dot";
import {parse} from "babylon";
import traverse from "babel-traverse";
import CfgBuilder from "../../lib/cfg/cfg-builder";
import {createTraverseVisitorWrapper} from "../../lib/util";

describe("CfgBuilder integration tests", () => {
	const testCasesDirectory = "./test/cfg/test-cases";
	const cases = glob.sync("**/*.case.js", { cwd: testCasesDirectory });

	for (const casePath of cases) {
		const sourceCode = fs.readFileSync(path.join(testCasesDirectory, casePath), "utf-8");
		const expectedPath = casePath.replace(/\.case\.js/, ".expected.dot");
		const expected = fs.readFileSync(path.join(testCasesDirectory, expectedPath), "utf-8");

		describe(casePath, () => {
			it("creates the control flow graph correctly", () => {
				// arrange
				const ast = parse(sourceCode);
				const builder = new CfgBuilder(ast);

				// act
				traverse(ast, createTraverseVisitorWrapper(builder));

				// assert
				const dot = cfgToDot(ast.cfg, {stable: true});
				expect(dot).to.equal(expected);
			});
		});
	}
});
