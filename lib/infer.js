// import traverse from "babel-traverse";
// import * as t from "babel-types";
// import SourceFile from "./semantic-model/source-file";
// import Symbol from "./semantic-model/symbol";
// import chalk from "chalk";

import Program from "./semantic-model/program";
import CfgBuilder from "./cfg/cfg-builder";
import SymbolExtractor from "./semantic-model/symbol-extractor";
import {plotControlFlowGraph} from "./cfg/dot";
import WorklistDataFlowAnalyzer from "./data-flow-analysis/worklist-data-flow-analyzer";
import NullInferenceAnalysis from "./data-flow-analysis/null-inference";

export function inferProgram (entryFile, context) {
	const program = new Program(entryFile);

	infer(entryFile, context, program)  ;
	return program;
}

export function infer (file, context, program) {
	const content = context.moduleResolution.readFile(file);

	const canoncialName = context.moduleResolution.canoncialName(file);
	const sourceFile = program.createSourceFile(canoncialName, content);

	sourceFile.parse();
	sourceFile.analyse([new CfgBuilder(sourceFile.ast), new SymbolExtractor(program.globalScope)]);

	console.log(Array.from(program.globalScope.getAllSymbols()));
	plotControlFlowGraph(sourceFile.ast.cfg);

	const dataFlow = new WorklistDataFlowAnalyzer(sourceFile.ast.cfg, NullInferenceAnalysis);
	dataFlow.analyze();

	console.log(sourceFile.ast.cfg.getNode(null).annotation.out);

	program.addSourceFile(sourceFile);

	return sourceFile;
}
