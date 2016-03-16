import Scope from "./scope";

export class SourceFile {
	constructor(path, text, parentScope) {
		this.path = path;
		this.text = text;
		this.scope = new Scope(parentScope);
		this._currentScope = this.scope;
	}

	enterChildScope() {
		this._currentScope = new Scope(this._currentScope);
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