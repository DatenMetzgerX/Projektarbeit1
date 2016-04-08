import * as t from "babel-types";
import {TypeVariable, FunctionType, NullType, VoidType} from "../../semantic-model/types";
import {BRANCHES} from "../../cfg/control-flow-graph";
import {TypeInferenceError} from "../type-inference-error";

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
		if (!node.id) {
			throw new TypeInferenceError("The implementation can not yet handle anonymous functions", node);
		}

		const parameterTypes = this._getParameterTypes(node, context);
		const returnType = this._getReturnType(node, context);
		const type = new FunctionType(new NullType(), parameterTypes, returnType);

		const symbol = context.getSymbol(node.id);
		context.setType(symbol, type);

		return type;
	}

	_getParameterTypes(node, context) {
		const parameterTypes = [];
		for (const parameter of node.params) {
			const parameterSymbol = context.getSymbol(parameter);
			const parameterType = new TypeVariable();

			context.setType(parameterSymbol, parameterType);
			parameterTypes.push(parameterType);
		}
		return parameterTypes;
	}

	_getReturnType(node, context) {
		if (this._allNonExceptionExitsWithExplicitReturnStatement(node, context)) {
			return new TypeVariable();
		} else {
			// at least one exit node has a non explicit return value and therefore the function might return void
			return new VoidType();
		}
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