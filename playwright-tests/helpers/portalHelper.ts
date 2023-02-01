import User from '@support/types/user.interface';
import faker from 'faker';
import { generate } from 'generate-password';

/*
Using generate-password lib due to a bug in a faker when passing a regex to a password function.
https://github.com/Marak/faker.js/issues/826
*/
export const getUser = (email: string = ''): User => {
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();

  const user: User = {
    email: email || getFakeEmail(firstName, lastName),
    password: getPassword(),
    firstName,
    lastName,
  };

  return user;
};

const getPassword = () =>
  generate({
    length: 10,
    numbers: true,
    lowercase: true,
    uppercase: true,
    strict: true,
  });

const getFakeEmail = (firstName: string, lastName: string) => {
  const random = faker.datatype.number();

  return `ui_tests_${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Date.now()}.${random}@test.com`;
};
