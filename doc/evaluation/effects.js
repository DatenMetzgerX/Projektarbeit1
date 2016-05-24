function setAddress(p, street, zip) {
	p.address = { street, zip } ;
}

const person = { lastName: "Reiser" };
setAddress(person, "Bahnhofstrasse 12", 8001);
const street = person.address.street;