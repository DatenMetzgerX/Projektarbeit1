import CfgBuilder from "./cfg/cfg-builder";
import SymbolExtractor from "./semantic-model/symbol-extractor";
import TypeInferenceAnalysis from "./type-inference/type-inference";
import {WorklistDataFlowAnalyzer} from "./data-flow-analysis/worklist-data-flow-analyzer";

export function infer(sourceFile, program) {
	sourceFile.parse();
	sourceFile.analyse([new CfgBuilder(sourceFile.ast), new SymbolExtractor(program)]);

	// depends on the symbols, needs to be performed in a second traversal.

	const typeInferenceAnalyzer = new WorklistDataFlowAnalyzer(sourceFile.ast.cfg, new TypeInferenceAnalysis(program));
	typeInferenceAnalyzer.analyze();
	sourceFile.ast.cfg.getNode(null).annotation.out.assignTypeToSymbols();

}

