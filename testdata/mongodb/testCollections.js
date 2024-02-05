const dbObject = { name: 'Honey1', age: 25, cars: ['Audi R8'] };

const dbArray = [
  {
    name: 'Midhuna2', age: 23, cars: ['BMW 320d', 'Audi R8'], place: 'Amaravati',
  },
  {
    name: 'Akhil2', age: 24, cars: ['Audo A7', 'Agera R'], place: 'New York',
  },
  { name: 'Honey2', age: 25, cars: ['Audi R8'] },
];

for (let i = 1; i <= 5; i++) {
  db = db.getSiblingDB(`testingCollections${i}`);
  db.customers.insert(dbObject);
  db.customers.insertMany(dbArray);
  db.products.insert(dbObject);
  db.products.insertMany(dbArray);
  db.users.insert(dbObject);
  db.users.insertMany(dbArray);
}

db.students.insertMany([
  {
    sID: 22001, name: 'Alex', year: 1, score: 4.0,
  },
  {
    sID: 21001, name: 'bernie', year: 2, score: 3.7,
  },
  {
    sID: 20010, name: 'Chris', year: 3, score: 2.5,
  },
  {
    sID: 22021, name: 'Drew', year: 1, score: 3.2,
  },
]);

db.createView(
  'firstYears',
  'students',
  [{ $match: { year: 1 } }],
);
