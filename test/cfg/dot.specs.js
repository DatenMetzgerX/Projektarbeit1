import {expect} from "chai";
import {parse} from "babylon";

import {cfgToDot} from "../../lib/cfg/dot";
import ControlFlowGraph, {BRANCHES} from "../../lib/cfg/control-flow-graph";

describe("dot", () => {
	describe("cfgToDot", () => {
		it("returns an empty digraph when the cfg is empty", () => {
			// arrange
			const cfg = new ControlFlowGraph();

			// act
			const dot = cfgToDot(cfg);

			// assert
			expect(dot).to.equal(
`digraph cfg {
}`);
		});

		it("creates a node for each node in the cfg", () => {
			// arrange
			const ast = parse(`
				const x = 10;
				const y = 11;
			`);

			const xAssignment = ast.program.body[0];
			const yAssignment = ast.program.body[1];

			const cfg = new ControlFlowGraph();
			cfg.createNode(xAssignment);
			cfg.createNode(yAssignment);

			// act
			const dot = cfgToDot(cfg, { stable: true});

			// assert
			expect(dot).to.equal(
`digraph cfg {
  "0" [ label = "2 const x = 10" ];
  "1" [ label = "3 const y = 11" ];
}`);
		});

		it("creates an edge for each successor of a node", () => {
			// arrange
			const ast = parse(`
				const x = 10;
				const y = 11;
				const z = 12;
			`);

			const xAssignment = ast.program.body[0];
			const yAssignment = ast.program.body[1];
			const zAssignment = ast.program.body[2];

			const cfg = new ControlFlowGraph();
			cfg.connectIfNotFound(xAssignment, BRANCHES.UNCONDITIONAL, yAssignment);
			cfg.connectIfNotFound(yAssignment, BRANCHES.UNCONDITIONAL, zAssignment);
			cfg.connectIfNotFound(zAssignment, BRANCHES.UNCONDITIONAL, null);

			// act
			const dot = cfgToDot(cfg, { stable: true});

			// assert
			expect(dot).to.equal(
`digraph cfg {
  "0" [ label = "2 const x = 10" ];
  "1" [ label = "3 const y = 11" ];
  "2" [ label = "4 const z = 12" ];
  "3" [ label = "EOF" ];
  "0" -> "1" [ label = "Unconditional" ];
  "1" -> "2" [ label = "Unconditional" ];
  "2" -> "3" [ label = "Unconditional" ];
}`);
		});
	});
});