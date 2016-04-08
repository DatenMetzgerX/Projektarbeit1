import TypeEnvironment from "./type-environment";
import process from "process";
import {createLabelForNode} from "../util";

/**
 * A type inference that infers the most specific type for each position in the cfg.
 * @implements {DataFlowAnalysis}
 */
export class ForwardAnalysisTypeInference {
	/**
	 * Creates a new forward type inference analysis that uses the passed in hindley milner instance
	 * @param {HindleyMilner} hindleyMilner
     */
	constructor(hindleyMilner) {
		this.hindleyMilner = hindleyMilner;
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

		const out = this._withTypeEnvironment(inTypeEnvironment, () => this.hindleyMilner.infer(node));

		const diff = out.difference(inTypeEnvironment);
		process.stdout.write(`Diff for transfer function of node ${createLabelForNode(node)}:\n`);
		diff.dump(process.stdout);
		process.stdout.write("\n");

		return out;
	}

	joinBranches(first, others, node) {
		return this._withTypeEnvironment(first, () => this.hindleyMilner.mergeWithTypeEnvironments(others, node));
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

	_withTypeEnvironment(environment, callback) {
		this.hindleyMilner.typeEnvironment = environment;
		try {
			callback();
			return this.hindleyMilner.typeEnvironment;
		} finally {
			this.hindleyMilner.typeEnvironment = TypeEnvironment.EMPTY;
		}
	}
}

export default ForwardAnalysisTypeInference;