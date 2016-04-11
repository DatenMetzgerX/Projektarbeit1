import TypeEnvironment from "./type-environment";
import process from "process";
import {createLabelForNode} from "../util";
import {TypeInferenceContext} from "./type-inference-context";
import {HindleyMilner} from "./hindley-milner";

/**
 * A type inference that infers the most specific type for each position in the cfg.
 * @implements {DataFlowAnalysis}
 */
export class ForwardAnalysisTypeInference {
	/**
	 * Creates a new forward type inference analysis for the passed in program
	 * @param {Program} program the program that is being analysed
	 * @param {HindleyMilner} [hindleyMilner] the hindley milner algorithm instance to use
     */
	constructor(program, hindleyMilner=new HindleyMilner()) {
		this._program = program;
		this._hindleyMilner = hindleyMilner;
	}

	createEmptyLattice() {
		return TypeEnvironment.EMPTY;
	}

	createEntryLattice() {
		return TypeEnvironment.EMPTY;
	}

	transfer(node, inTypeEnvironment) {
		if (node === null) {
			return inTypeEnvironment;
		}

		const context = new TypeInferenceContext(this._program, inTypeEnvironment);
		this._hindleyMilner.infer(node, context);
		const out = context.typeEnvironment;

		const diff = out.difference(inTypeEnvironment);
		process.stdout.write(`Diff for transfer function of node ${createLabelForNode(node)}:\n`);
		diff.dump(process.stdout);
		process.stdout.write("\n");

		return out;
	}

	joinBranches(first, others, node) {
		const context = new TypeInferenceContext(this._program, first);
		this._hindleyMilner.mergeWithTypeEnvironments(others, node.value || {}, context);
		return context.typeEnvironment;
	}

	/**
	 * Returns true if the two type environments are the same.
	 * A deep equality check is not needed as transfer returns the same type environment if the hindley milner algorithm
	 * has not refined any type.
	 * @param {TypeEnvironment} env1
	 * @param {TypeEnvironment} env2
	 * @returns {boolean} true if the instances are the same
     */
	areLatticesEqual(env1, env2) {
		return env1 === env2;
	}
}

export default ForwardAnalysisTypeInference;