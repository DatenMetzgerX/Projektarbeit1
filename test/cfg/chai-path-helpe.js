import {Assertion} from "chai";
import {NodePath} from "babel-traverse";

/**
 * Chai helper that can be used to test if two paths are equal (==).
 * This helper is preferred over the equal helper as chai (or mocha) runs out of memory when calculating
 * the diff for two paths. This helper returns a textual representation of the path in the ast tree that. This makes
 * it easier to interpret assertion failures.
 */
Assertion.addMethod("equalPath", function (expectedPath) {
	new Assertion(expectedPath).to.be.instanceOf(NodePath);
	new Assertion(this._obj).to.be.instanceOf(NodePath);


	this.assert(
		this._obj === expectedPath,
		"expected #{this} to be equal to path #{exp} but got #{act}",
		"expected #{this} to not be equal to path #{act}",
		expectedPath.getPathLocation(), this._obj.getPathLocation()
	);
});