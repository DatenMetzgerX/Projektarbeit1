import * as t from "babel-types";
import {TypeVariable, FunctionType, VoidType} from "../../semantic-model/types";
import {BRANCHES} from "../../cfg/control-flow-graph";

/**
 * Refinement rule that handles function declarations, arrow functions and methods.
 * WIP.
 * @implements {RefinementRule}
 */
export class FunctionRefinementRule {
	canRefine(node) {
		return t.isFunction(node);
	}

	refine(node, context) {
		const parameterTypes = this._getParameterTypes(node);
		const returnType = this._getReturnType(node, context);
		const type = new FunctionType(TypeVariable.create(), parameterTypes, returnType, node);

		context.setType(context.getSymbol(node), type);
		type.typeEnvironment = context.typeEnvironment; // the type needs to contain it's own declaration

		return type;
	}

	_getParameterTypes(node) {
		return node.params.map(() => TypeVariable.create());
	}

	_getReturnType(node, context) {
		if (this._allNonExceptionExitsWithExplicitReturnStatement(node.body, context)) {
			return TypeVariable.create();
		}
		// at least one exit node has a non explicit return value and therefore the function might return void
		return VoidType.create();
	}

	_allNonExceptionExitsWithExplicitReturnStatement(node, context) {
		const cfg = context.getCfg(node);
		const cfgNode = cfg.getNode(node);
		const exitEdges = cfg.getExitEdges(cfgNode);

		for (const exitEdge of exitEdges) {
			if (!t.isReturnStatement(exitEdge.src.value) && exitEdge.branch !== BRANCHES.EXCEPTION) {
				return false;
			}
		}

		return true;
	}
}

export default FunctionRefinementRule;