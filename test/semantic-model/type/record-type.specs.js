import {expect} from "chai";
import {RecordType, StringType, NumberType, MaybeType, TypeVariable} from "../../../lib/semantic-model/types";

describe("RecordType", function () {
	describe("addProperty", function () {
		it("has a property with the given type and name afterwards", function() {
			// arrange
			const record = new RecordType();

			// act
			record.addProperty("name", new StringType());

			// assert
			expect(record.hasProperty("name")).to.be.true;
			expect(record.getType("name")).to.be.instanceOf(StringType);
		});

		it("throws if a property with the given name already exists", function () {
			// arrange
			const record = new RecordType();
			record.addProperty("name", new StringType());

			// act, assert
			expect(() => record.addProperty("name", new StringType())).to.throw("AssertionError: A property with the given name already exists");
		});
	});

	describe("hasProperty", function () {
		it ("returns false if the record has no property with the given name", function () {
			expect(new RecordType().hasProperty("name")).to.be.false;
		});
	});

	describe("getType", function () {
		it("returns undefined if the record has no property with the given name", function () {
			expect(new RecordType().getType("name")).to.be.undefined;
		});
	});

	describe("prettyName", function () {
		it("returns {} if the record has no properties", function () {
			expect(new RecordType().prettyName).to.equal("{}");
		});

		it("returns an object literal where the key is the name of the property and the value is the type of the property", function () {
			// arrange
			const record = new RecordType();
			record.addProperty("name", new StringType());
			record.addProperty("age", new NumberType());

			// act, assert
			expect(record.prettyName).to.equal("{name: string, age: number}");
		});
	});

	describe("resolveDeep", function () {
		it("returns the resolved type", function () {
			// arrange
			const original = new RecordType();
			original.addProperty("name", new StringType());
			original.addProperty("age", new NumberType());

			const resolved = new RecordType();
			resolved.addProperty("name", new StringType());
			original.resolvesTo(resolved);

			// act
			const deepResolved = original.resolveDeep();

			// assert
			expect(deepResolved).to.equal(resolved);
		});

		it("resolves the types of all properties", function () {
			const original = new RecordType();
			original.addProperty("name", new StringType());
			original.addProperty("age", new NumberType());

			const resolved = new RecordType();
			const resolvedNameType = new MaybeType(new StringType());
			const nameType = new StringType();
			nameType.resolvesTo(resolvedNameType);
			resolved.addProperty("name", nameType);
			original.resolvesTo(resolved);

			// act
			const deepResolved = original.resolveDeep();

			// assert
			expect(deepResolved.getType("name")).to.equal(resolvedNameType);
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

			const thisType = new RecordType();
			thisType.addProperty("name", otherType);

			// act
			expect(thisType.containsType(otherType)).to.be.true;
		});

		it("returns false if t2 is not used inside a property type", function () {
			// arrange
			const otherType = new TypeVariable();

			const thisType = new RecordType();
			thisType.addProperty("name", new StringType());

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
			const t1 = new RecordType();
			t1.addProperty("name", new StringType());
			t1.addProperty("age", new NumberType());

			const t2 = new RecordType();
			t2.addProperty("name", new StringType());
			t2.addProperty("age", new NumberType());
			t2.addProperty("lastName", new StringType());

			// act, assert
			expect(t1.equals(t2)).to.be.false;
		});

		it("returns false if both records have the same properties but with different types", function () {
			// arrange
			const t1 = new RecordType();
			t1.addProperty("name", new StringType());
			t1.addProperty("age", new NumberType());

			const t2 = new RecordType();
			t2.addProperty("name", new StringType());
			t2.addProperty("age", new MaybeType(new NumberType()));

			// act, assert
			expect(t1.equals(t2)).to.be.false;
		});

		it("returns true if both records have the same properties with equal types", function () {
			// arrange
			const t1 = new RecordType();
			t1.addProperty("name", new StringType());
			t1.addProperty("age", new NumberType());

			const t2 = new RecordType();
			t2.addProperty("name", new StringType());
			t2.addProperty("age", new NumberType());

			// act, assert
			expect(t1.equals(t2)).to.be.true;
		});
	});
});