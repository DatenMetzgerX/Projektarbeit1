import {expect} from "chai";
import {Type, FunctionType, VoidType} from "../../../lib/semantic-model/types/index";

describe("FunctionType", function () {
	describe("thisType", function () {
		it("returns the this type from the type parameters", function () {
			// arrange
			const thisType = new Type("this");
			const functionType = new FunctionType(thisType, [new Type("number"), new Type("string")], new VoidType());

			// act, assert
			expect(functionType.thisType).to.equal(thisType);
		});
	});

	describe("parameterTypes", function () {
		it("returns an empty List if the function does not have any parameters", function () {
			// arrange
			const functionType = new FunctionType(new Type("this"), [], new VoidType());

			// act, assert
			expect(functionType.parameterTypes.toArray()).to.be.empty;
		});

		it("returns a list with the functions type parameters", function () {
			// arrange
			const parameters = [new Type("number"), new Type("string")];
			const functionType = new FunctionType(new Type("this"), parameters, new VoidType());

			// act, assert
			expect(functionType.parameterTypes.toArray()).to.deep.equal(parameters);
		});
	});

	describe("returnType", function () {
		it("returns the return type of the function", function () {
			// arrange
			const returnType = new Type("number");
			const functionType = new FunctionType(new Type("this"), [new Type("number"), new Type("string")], returnType);

			// act, assert
			expect(functionType.returnType).to.equal(returnType);
		});

		it("returns the return type of the function even when the function does not have any parameters", function () {
			// arrange
			const returnType = new Type("number");
			const functionType = new FunctionType(new Type("this"), [], returnType);

			// act, assert
			expect(functionType.returnType).to.equal(returnType);
		});
	});

	describe("toString", function () {
		it("returns a string representation of the form thisType.(parameterTypes) -> returnType", function () {
			// arrange
			const functionType = new FunctionType(new Type("this"), [new Type("number"), new Type("string")], new Type("number"));

			// act, assert
			expect(functionType.toString()).to.equal("this.(number, string) -> number");
		});
	});
});