import {expect} from "chai";
import {Symbol, SymbolFlags} from "../../../lib/semantic-model/symbol";
import {RecordType, StringType, NumberType, MaybeType, TypeVariable, NullType} from "../../../lib/semantic-model/types";

describe("RecordType", function () {
	const name = new Symbol("name", SymbolFlags.Property);
	const age = new Symbol("age", SymbolFlags.Property);

	describe("fresh", function () {
		it("returns a new instance that has the same properties", function () {
			// arrange
			const original = createRecord([[name, new StringType()], [age, new NumberType()]]);

			// act
			const fresh = original.fresh();

			// assert
			expect(fresh).not.to.equal(original);
			expect(fresh.properties).to.deep.equal(original.properties);
		});

		it("returns a new instance that has not the same id as the original one", function () {
			// arrange
			const original = createRecord([[name, new StringType()], [age, new NumberType()]]);

			// act
			const fresh = original.fresh();

			// assert
			expect(fresh.id).not.to.equal(original.id);
		});
	});

	describe("addProperty", function () {
		it("returns a new record that has a property with the given type and name", function() {
			// arrange
			const record = new RecordType();

			// act
			const withProperty = record.addProperty(name, new StringType());

			// assert
			expect(withProperty).not.to.equal(record);
			expect(withProperty.hasProperty(name)).to.be.true;
			expect(withProperty.getType(name)).to.be.instanceOf(StringType);
		});

		it("throws if a property with the given name already exists", function () {
			// arrange
			const record = createRecord([[name, new StringType()]]);

			// act, assert
			expect(() => record.addProperty(name, new StringType())).to.throw("AssertionError: A property with the given name already exists");
		});
	});

	describe("hasProperty", function () {
		it ("returns false if the record has no property with the given name", function () {
			expect(new RecordType().hasProperty(name)).to.be.false;
		});
	});

	describe("setType", function () {
		it("throws if no property with the given name exists", function () {
			expect(() => new RecordType().setType(name, new StringType())).to.throw("AssertionError: property does not yet exist, to add new properties use add property");
		});

		it("returns a new record type where the symbol is associated with the new type", function () {
			const record = createRecord([[name, new NullType()]]);

			// act
			const changedRecord = record.setType(name, new StringType());

			// assert
			expect(changedRecord.getType(name)).to.be.instanceOf(StringType);
		});
	});

	describe("getType", function () {
		it("returns undefined if the record has no property with the given name", function () {
			expect(new RecordType().getType(name)).to.be.undefined;
		});
	});

	describe("prettyName", function () {
		it("returns {} if the record has no properties", function () {
			expect(new RecordType().prettyName).to.equal("{}");
		});

		it("returns an object literal where the key is the name of the property and the value is the type of the property", function () {
			const record = createRecord([[name, new StringType()], [age, new NumberType()]]);

			// act, assert
			expect(record.prettyName).to.equal("{name: string, age: number}");
		});
	});

	describe("containsType", function () {
		it("returns true if this and t2 are the same instances", function () {
			// arrange
			const t = new RecordType();

			// act, assert
			expect(t.containsType(t)).to.be.true;
		});

		it("returns true if t2 is used as type property type", function () {
			// arrange
			const otherType = new TypeVariable();

			const thisType = createRecord([[name, otherType]]);

			// act
			expect(thisType.containsType(otherType)).to.be.true;
		});

		it("returns false if t2 is not used inside a property type", function () {
			// arrange
			const otherType = new TypeVariable();

			const thisType = createRecord([[name, new StringType()]]);

			// act
			expect(thisType.containsType(otherType)).to.be.false;
		});
	});

	describe("equals", function () {
		it("returns false if not both types are record types", function () {
			// arrange
			const t1 = new RecordType();
			const t2 = new StringType();

			// act, assert
			expect(t1.equals(t2)).to.be.false;
		});

		it("returns false if both records have not the same properties", function () {
			// arrange
			const lastName = new Symbol("lastName", SymbolFlags.Property);

			const t1 = createRecord([[name, new StringType()], [age, new NumberType()]]);
			const t2 = createRecord([[name, new StringType()], [age, new NumberType()], [lastName, new StringType()]]);

			// act, assert
			expect(t1.equals(t2)).to.be.false;
		});

		it("returns false if both records have the same properties but with different types", function () {
			// arrange
			const t1 = createRecord([[name, new StringType()], [age, new NumberType()]]);
			const t2 = createRecord([[name, new StringType()], [age, new MaybeType(new NumberType())]]);

			// act, assert
			expect(t1.equals(t2)).to.be.false;
		});

		it("returns true if both records have the same properties with equal types", function () {
			// arrange
			const t1 = createRecord([[name, new StringType()], [age, new NumberType()]]);
			const t2 = createRecord([[name, new StringType()], [age, new NumberType()]]);

			// act, assert
			expect(t1.equals(t2)).to.be.true;
		});
	});

	describe("substitute", function () {
		it("replaces the types of the properties using the old type with the new type", function () {
			// arrange
			const oldType = new TypeVariable();
			const newType = new StringType();

			const record = createRecord([[name, oldType], [age, new NumberType()]]);

			// act
			const substituted = record.substitute(oldType, newType);

			// assert
			expect(substituted.getType(name)).to.equal(newType);
		});

		it("returns the same object if no type has been replaced", function () {
			const record = createRecord([[name, new StringType()], [age, new NumberType() ]]);

			// act
			const substituted = record.substitute(new TypeVariable(), new StringType());

			// assert
			expect(substituted).to.equal(record);
		});
	});

	function createRecord(properties) {
		return RecordType.create(RecordType, properties);
	}
});