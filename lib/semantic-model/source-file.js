import {parse} from "babylon";
import traverse, {visitors} from "babel-traverse";
import ParentInitializerVisitor from "./parent-initializer-visitor";
import Scope from "./scope";

export class SourceFile {
	constructor(path, text, globalScope) {
		this.path = path;
		this.text = text;

		this.ast = {};
		this.scope = new Scope(globalScope);
		this._currentScope = this.scope;
	}

	parse() {
		this.ast = parse(this.text, {
			sourceType: "module" // default: "script"
		});
	}

	analyse(analysers) {
		const astVisitors = [];
		const states = [];

		for (const analyser of [new ParentInitializerVisitor()].concat(analysers)) {
			if (analyser.init) {
				analyser.init();
			}

			astVisitors.push(analyser.visitor);
			states.push(analyser.state);
		}

		const mergedVisitor = visitors.merge(astVisitors, states);
		traverse(this.ast, mergedVisitor);
	}

	enterChildScope() {
		this._currentScope = this._currentScope.createChild();
		return this._currentScope;
	}

	exitChildScope() {
		this._currentScope = this._currentScope.parent;
		return this._currentScope;
	}

	get currentScope() {
		return this._currentScope;
	}
}

export default SourceFile;