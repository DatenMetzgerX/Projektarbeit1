import Immutable from "immutable";

class NullState {
	constructor(state, reason) {
		this.state = state;
		this.reason = reason;
	}

	toJSON() {
		return `${this.state}: ${this.reason}`;
	}
}

const IS_NULL = "null";
const IS_UNDEFINED = "undefined";
const HAS_VALUE = "*";

const EMPTY_LATTICE = new Immutable.Map();
const ENTRY_LATTICE = new Immutable.Map();

/**
 *
 * @implements DataFlowAnalysis
 */
export const NullInferenceAnalysis = {
	createEntryLattice() {
		return ENTRY_LATTICE;
	},

	createEmptyLattice() {
		return EMPTY_LATTICE;
	},

	joinBranches(branchesOutStates) {
		return new Immutable.Map().mergeDeep(...branchesOutStates);
	},

	transfer(node, inMap) {
		if (!node) {
			return inMap;
		}
		const outMap = inMap.asMutable();

		switch (node.type) {
		case "VariableDeclaration":
			for (const declaration of node.declarations) {
				// todo init might assign undefined or null, in this case this is not true
				const state = declaration.init ? new NullState(HAS_VALUE, declaration.init) : new NullState(IS_UNDEFINED);
				outMap.set(declaration.id._symbol, state);
			}
		}

		return outMap.asImmutable();
	},

	areLatticesEqual: Immutable.is
};

export default NullInferenceAnalysis;