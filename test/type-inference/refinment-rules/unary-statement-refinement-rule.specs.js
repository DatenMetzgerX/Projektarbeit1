import {expect} from "chai";
import * as t from "babel-types";


describe("UnaryExpressionRefinementRule", function () {
	let rule;
	
	beforeEach(function() {
		rule = new UnaryExpressionRefinementRule();	
	});
	
	describe("canRefine", function() {
		it("returns true if the node is an unary expression", function () {
			// arrange
			const expression = t.unaryExpression("!", t.identifier("x"));
			
			// act, assert
			expect()
		});
	});
});