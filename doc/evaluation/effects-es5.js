function setAddress(p, street, zip) {
	p.address = { street: street, zip: zip } ;
}

var person = { 
	lastName: "Reiser" 
};
setAddress(person, "Bahnhofstrasse 12", 8001);
var street = person.address.street;