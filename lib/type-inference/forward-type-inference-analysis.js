import traverse from "babel-traverse";

import TypeEnvironment from "./type-environment";
import {HindleyMilner} from "./hindley-milner";
import {HindleyMilnerContext} from "./hindley-milner-context";
import {HindleyMilnerDataFlowAnalysis} from "./hindley-milner-data-flow-analysis";
import {TypeInferenceContext} from "./type-inference-context";
import {addsTypesOfBuiltInVariables} from "../semantic-model/built-in-variables";
import {createTraverseVisitorWrapper} from "../util";
import {FunctionDeclarationVisitor} from "./function-declaration-visitor";

/**
 * Interface for a type inference analysis
 *
 * @typedef {Object} TypeInferenceAnalysis
 * @interface
 *
 * @property {function (node: AstNode, context: HindleyMilnerContext): Type} infer infers the type for the given node
 * @property {function (t1: Type, t2: Type, node: AstNode, context: HindleyMilnerContext): Type} unify unifies the type t1 and t2
 * @property {function (node: AstNode, typeEnvironment: TypeEnvironment): void} analyse the types for all nodes from this node to the end of the control flow.
 */

/**
 * A type inference that infers the most specific type for each position in the cfg.
 */
export class ForwardTypeInferenceAnalysis {
	/**
	 * Creates a new forward type inference analysis for the passed in program
	 * @param {Program} program the program that is being analysed
	 * @param {HindleyMilner} hindleyMilner the hindley milner instance to use
     */
	constructor(program, hindleyMilner=new HindleyMilner()) {
		this._program = program;
		this._hindleyMilner = hindleyMilner;
	}

	getDefaultTypeEnvironment() {
		const typeEnvironment = TypeEnvironment.EMPTY;
		return addsTypesOfBuiltInVariables(this._program.globalScope, typeEnvironment);
	}

	/**
	 * Performs a type inference for the given source file
	 * @param {SourceFile} sourceFile the source file to analyse
	 * @param {TypeEnvironment} [typeEnvironment] type environment that should be used as start
	 * @returns {Map<ASTNode, TypeEnvironment>} the type environments for the analysed nodes
     */
	analyseSourceFile(sourceFile, typeEnvironment=this.getDefaultTypeEnvironment()) {
		const cfg = sourceFile.ast.cfg;

		const functionDeclarationVisitor = new FunctionDeclarationVisitor(this._program, typeEnvironment);
		traverse(sourceFile.ast.program, createTraverseVisitorWrapper(functionDeclarationVisitor));
		typeEnvironment = functionDeclarationVisitor.typeEnvironment;

		const workListAnalyser = new HindleyMilnerDataFlowAnalysis(this, typeEnvironment);
		const nonEmptyNodes = sourceFile.ast.program.body.filter(node => node.type !== "EmptyStatement");
		if (!nonEmptyNodes.length) {
			return new Map();
		}

		return workListAnalyser.analyse(cfg, nonEmptyNodes[0]);
	}

	/**
	 * Performs a type inference / type checking for the passed in node and all nodes that follow in the control flow.
	 * @param {AstNode} node the AST node from which the type checking should be started
	 * @param {TypeEnvironment} [typeEnvironment] The type environment to use
	 * @returns {Map<ASTNode, TypeEnvironment>} the type environments for the analysed nodes
     */
	analyse(node, typeEnvironment=this.getDefaultTypeEnvironment()) {
		const cfg = this._program.getCfg(node);

		const workListAnalyser = new HindleyMilnerDataFlowAnalysis(this, typeEnvironment);
		return workListAnalyser.analyse(cfg, node);
	}

	/**
	 * Joins the type environments
	 * @param {TypeEnvironment} head the type environment that should be joined with the other type environments
	 * @param {TypeEnvironment[]} others other type environments that should be joined with the head type environment
	 * @param {AstNode} node The ast node that causes the join
	 * @returns {TypeEnvironment} the joined type environment
     */
	joinTypeEnvironments(head, others, node) {
		const context = this.createHindleyMilnerContext(head);
		this._hindleyMilner.mergeWithTypeEnvironments(others, node, context);
		return context.typeEnvironment;
	}

	/**
	 * Creates a new type inference context that is based on the given type environment
	 * @param {TypeEnvironment} typeEnvironment the type environment to use for the new context
	 * @returns {TypeInferenceContext} the created context
     */
	createTypeInferenceContext(typeEnvironment) {
		return new TypeInferenceContext(this._program, typeEnvironment);
	}

	/**
	 * Creates a new hindley milner context
	 * @param {TypeEnvironment|TypeInferenceContext} inferenceContextOrTypeEnvironment a type inference context or a type environment
	 * @returns {HindleyMilnerContext} the created hindley milner context
     */
	createHindleyMilnerContext(inferenceContextOrTypeEnvironment) {
		const typeInferenceAnalysis = this;
		const inferenceContext = inferenceContextOrTypeEnvironment instanceof TypeInferenceContext ? inferenceContextOrTypeEnvironment : this.createTypeInferenceContext(inferenceContextOrTypeEnvironment);

		return new HindleyMilnerContext({
			infer(node, context) {
				return typeInferenceAnalysis._hindleyMilner.infer(node, context);
			},

			unify(t1, t2, node, context) {
				return typeInferenceAnalysis._hindleyMilner.unify(t1, t2, node, context);
			},

			analyse(node, typeEnvironment) {
				return typeInferenceAnalysis.analyse(node, typeEnvironment);
			}
		}, inferenceContext);
	}
}

export default ForwardTypeInferenceAnalysis;