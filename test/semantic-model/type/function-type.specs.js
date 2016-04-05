import {expect} from "chai";
import {Type, FunctionType, VoidType} from "../../../lib/semantic-model/types/index";

describe("FunctionType", function () {

	describe("typeParameters", function () {
		it("returns an array containing the this and return type for a function without parameters", function () {
			// arrange
			const thisType = new Type("this");
			const returnType = new VoidType();
			const functionType = new FunctionType(thisType, [], returnType);

			// act, assert
			expect(functionType.typeParameters).to.deep.equal([thisType, returnType]);
		});

		it("returns an array containing the this type, the types of all parameters and the return type for a function with parameters", function () {
			// arrange
			const thisType = new Type("this");
			const param1 = new Type("number");
			const param2 = new Type("string");
			const returnType = new VoidType();
			const functionType = new FunctionType(thisType, [param1, param2], returnType);

			// act, assert
			expect(functionType.typeParameters).to.deep.equal([thisType, returnType, param1, param2]);
		});

		it("setting the type parameters updates the this, parameter and return type", function () {
			// arrange
			const thisType = new Type("this");
			const param1 = new Type("number");
			const param2 = new Type("string");
			const returnType = new VoidType();
			const functionType = new FunctionType(new Type("oldThis"), [param1], new Type("OldReturn"));

			// act
			functionType.typeParameters = [thisType, returnType, param1, param2];

			// assert
			expect(functionType.thisType).to.equal(thisType);
			expect(functionType.params).to.deep.equal([param1, param2]);
			expect(functionType.returnType).to.equal(returnType);
		});
	});

	describe("prettyName", function () {
		it("returns a string representation of the form thisType.(parameterTypes) -> returnType", function () {
			// arrange
			const functionType = new FunctionType(new Type("this"), [new Type("number"), new Type("string")], new Type("number"));

			// act, assert
			expect(functionType.prettyName).to.equal("this.(number, string) -> number");
		});
	});
});