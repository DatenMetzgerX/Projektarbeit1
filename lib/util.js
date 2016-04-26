import glob from "glob";
import path from "path";
import * as t from "babel-types";
import generate from "babel-generator";
import {functions, startsWith, trimStart, endsWith, includes} from "lodash";
import assert from "assert";

/**
 * Requires all files that match the passed in pattern
 * @param {String} pattern string pattern that the files need to match to be required. Path is relative to the passed in module
 * @param {Module} module module to which the path should be resolved relative.
 * @returns {Iterator} an iterator over the loaded modules
 */
export function * globRequire(pattern, module) {
	for (const match of glob.sync(pattern, { cwd: path.dirname(module.filename)})) {
		yield module.require(match);
	}
}

/**
 * Requires all files that match the given glob pattern and creates an instance of the default object.
 * @param {string} pattern the glob pattern
 * @param {Module} module module that is used to resolve the paths.
 * @param [args] optional arguments that are passed directly to the constructor
 * @returns {Iterator} an iterator over the created instances
 */
export function * globRequireInstances(pattern, module, ...args) {
	for (const requiredModule of globRequire(pattern, module)) {
		yield new requiredModule.default(...args);
	}
}

/**
 * Verifies the function of a visitor object. The allowed methods on a visitor object are
 * - defaultHandler
 * - enterNodeType and exitNodeType
 * - methods prefixed with _
 *
 * @param visitorObject the visitor object to verify
 */
function checkVisitorObjectFunctions(visitorObject) {
	for (const f of functions(visitorObject)) {
		if (startsWith(f, "_") || f === "defaultHandler") {
			continue;
		}

		const cleanedMethodName = startsWith(f, "enter") ? trimStart(f, "enter") : trimStart(f, "exit");
		if (f === cleanedMethodName) {
			assert.fail(`Visitor methods need to be prefixed with enter or exit, following by the node type, method ${f} is not prefixed`);
		}

		if (!(cleanedMethodName in t.VISITOR_KEYS)) {
			assert.fail(`Unknown Node type '${cleanedMethodName}' for visitor`);
		}
	}
}

/**
 * The function wraps the passed in object in a way that it can be used as babel-traverse-visitor.
 * Babel traverse adds various requirements to the visitor object that can lead to bad design. The wrapper reverses
 * this limitation and allows an almost arbitrary object as visitor, also objects that are instances from a class.
 * The wrapper overcomes the following limitations
 *
 * - The wrappers ensures that the this context of a handler function is not changed to the visiting context. The wrapper passes
 *   the context as separate handler argument (Path, Context).
 * - The wrapper allows private methods starting with an underscore.
 * - The wrapper allows the registration of a default handler that is called always when no more specific handler exists.
 *   The default handler is a method called defaultHandler that accepts the path and the context
 *
 * The wrapper has one limitation. To be able to support the defaultHandler functionality, it cannot support aliases
 * @param visitorObject the object that should be wrapped as babel-traverse conform visitor.
 * @returns {Object}the visitor object that can be used with babel-traverse
 */
export function createTraverseVisitorWrapper(visitorObject) {
	checkVisitorObjectFunctions(visitorObject);

	const wrapper = {};
	let defaultHandler;

	if (visitorObject.defaultHandler) {
		defaultHandler = function (path) { visitorObject.defaultHandler(path, this); };
	} else {
		defaultHandler = function (path) { assert.fail(`Unhandled node type ${path.node.type}.`); };
	}

	for (const type in t.VISITOR_KEYS) {
		const enterHandler = visitorObject[`enter${type}`];
		const exitHandler = visitorObject[`exit${type}`];

		if (enterHandler || exitHandler) {
			const enterCallback = function (path) { enterHandler.call(visitorObject, path, this ); };
			const exitCallback = function (path) { exitHandler.call(visitorObject, path, this ); };

			if (exitHandler) {
				wrapper[type] = { enter: enterCallback, exit: exitCallback };
			} else {
				wrapper[type] = enterCallback;
			}
		} else {
			wrapper[type] = defaultHandler;
		}
	}

	return wrapper;
}

/**
 * Generates a single line label for a statement by  using the code representation of the node but without any
 * child nodes.
 * @param {AstNode} node the node for which the label should be generated
 * @returns {string} a label for this node
 */
export function createLabelForNode(node) {
	let label;

	function codeFor (node) {
		const { code } = generate(node, {
			retainLines: false,
			comments: false,
			quotes: "double"
		});

		let result = code.replace(/"/g, "\\\"");

		if (endsWith(result, ";")) {
			result = result.substring(0, result.length - 1);
		}
		if (includes(result, "\n")) {
			result = result.split("\n")[0] + "...";
		}
		return result;
	}

	if (!node ) {
		return "EOF";
	}

	if (t.isIfStatement(node)) {
		label = `if (${codeFor(node.test)})`;
	} else if (t.isWhileStatement(node)) {
		label = `while (${codeFor(node.test)})`;
	} else if (t.isForStatement(node)) {
		label = `for (${codeFor(node.init)}, ${codeFor(node.test)}, ${codeFor(node.update)})`;
	} else if (t.isForInStatement(node)) {
		label = `for (${codeFor(node.left)} in ${codeFor(node.right)})`;
	} else if (t.isForOfStatement(node)) {
		label = `for (${codeFor(node.left)} of ${codeFor(node.right)})`;
	} else if (t.isDoWhileStatement(node)) {
		label = `do ... while(${codeFor(node.test)})`;
	} else if (t.isSwitchStatement(node)) {
		label = `switch (${codeFor(node.discriminant)})`;
	} else if (t.isSwitchCase(node)) {
		if (node.test) {
			label = `case ${codeFor(node.test)}:`;
		} else {
			label = "default:";
		}
	} else if (t.isArrowFunctionExpression(node)) {
		const params = node.params.map(param => codeFor(param)).join(", ");
		label = `(${params}) => ...`;
	} else if (t.isFunction(node)) {
		const params = node.params.map(param => codeFor(param)).join(", ");
		const name = node.id ? node.id.name : node.key ? node.key.name : "anonymous";
		label = `function ${name} (${params})`;
	} else if (t.isClassDeclaration(node)) {
		label = `class ${codeFor(node.id)}`;
	} else if (t.isTryStatement(node)) {
		label = "try";
	} else if (t.isCatchClause(node)) {
		label = "catch";
	} else if (t.isBlockStatement(node)) {
		if (node.body.length === 0) {
			label = "{}";
		} else {
			label = "{ ... }";
		}
	} else {
		label = codeFor(node);
	}

	const lineOfCode = node && node.loc ? node.loc.start.line : "";

	return `${lineOfCode} ${label}`;
}