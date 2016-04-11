import {createTraverseVisitorWrapper} from "./util";
import CfgBuilder from "./cfg/cfg-builder";
import SymbolExtractor from "./semantic-model/symbol-extractor";
import {ForwardAnalysisTypeInference} from "./type-inference/forward-analysis-type-inference";
import {WorklistDataFlowAnalyzer} from "./data-flow-analysis/worklist-data-flow-analyzer";
import {HindleyMilner} from "./type-inference/hindley-milner";

export function infer(sourceFile, program) {
	sourceFile.parse();

	const visitors = [createTraverseVisitorWrapper(new CfgBuilder(sourceFile.ast)), createTraverseVisitorWrapper(new SymbolExtractor(program))];
	sourceFile.analyse(visitors);

	const forwardTypeInferenceAnalysis = new ForwardAnalysisTypeInference(new HindleyMilner(program));
	const typeInferenceAnalyzer = new WorklistDataFlowAnalyzer(sourceFile.ast.cfg, forwardTypeInferenceAnalysis);
	typeInferenceAnalyzer.analyze();
}

