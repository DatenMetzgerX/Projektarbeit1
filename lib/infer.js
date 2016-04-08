import {createTraverseVisitorWrapper} from "./util";
import CfgBuilder from "./cfg/cfg-builder";
import SymbolExtractor from "./semantic-model/symbol-extractor";
import TypeInferenceAnalysis from "./type-inference/type-inference";
import {WorklistDataFlowAnalyzer} from "./data-flow-analysis/worklist-data-flow-analyzer";

export function infer(sourceFile, program) {
	sourceFile.parse();

	const visitors = [createTraverseVisitorWrapper(new CfgBuilder(sourceFile.ast)), createTraverseVisitorWrapper(new SymbolExtractor(program))];
	sourceFile.analyse(visitors);

	const typeInferenceAnalyzer = new WorklistDataFlowAnalyzer(sourceFile.ast.cfg, new TypeInferenceAnalysis(program));
	typeInferenceAnalyzer.analyze();
}

