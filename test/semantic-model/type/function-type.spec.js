import {expect} from "chai";
import {Type, FunctionType, VoidType} from "../../../lib/semantic-model/types/index";

describe("FunctionType", function () {

	describe("typeParameters", function () {
		it("returns an array containing the this and return type for a function without parameters", function () {
			// arrange
			const thisType = new Type("this");
			const returnType = new VoidType();
			const functionType = new FunctionType(thisType, [], returnType, {});

			// act, assert
			expect(functionType.typeParameters).to.deep.equal([thisType, returnType]);
		});

		it("returns an array containing the this type, the types of all parameters and the return type for a function with parameters", function () {
			// arrange
			const thisType = new Type("this");
			const param1 = new Type("number");
			const param2 = new Type("string");
			const returnType = new VoidType();
			const functionType = new FunctionType(thisType, [param1, param2], returnType, {});

			// act, assert
			expect(functionType.typeParameters).to.deep.equal([thisType, returnType, param1, param2]);
		});
	});

	describe("withTypeParameters", function () {
		it("returns a new instance with the specified id", function () {
			// arrange
			const functionType = new FunctionType(new Type("oldThis"), [new Type("number")], new Type("OldReturn"), {});

			// act
			const newFunction = functionType.withTypeParameters([new Type("this"), new VoidType(), new Type("number"), new Type("string")], functionType.id);

			// assert
			expect(newFunction).not.to.equal(functionType);
			expect(newFunction.id).to.equal(functionType.id);
		});

		it("returns a new instance with the given this, param and return types", function () {
			// arrange
			const thisType = new Type("this");
			const param1 = new Type("number");
			const param2 = new Type("string");
			const returnType = new VoidType();
			const functionType = new FunctionType(new Type("oldThis"), [param1], new Type("OldReturn"), {});

			// act
			const newFunction = functionType.withTypeParameters([thisType, returnType, param1, param2]);

			// assert
			expect(newFunction.thisType).to.equal(thisType);
			expect(newFunction.params).to.deep.equal([param1, param2]);
			expect(newFunction.returnType).to.equal(returnType);
		});
	});

	describe("prettyName", function () {
		it("returns a string representation of the form thisType.(parameterTypes) -> returnType", function () {
			// arrange
			const functionType = new FunctionType(new Type("this"), [new Type("number"), new Type("string")], new Type("number"), {});

			// act, assert
			expect(functionType.prettyName).to.equal("this.(number, string) -> number");
		});
	});
});