import { faker } from '@faker-js/faker';

/**
 * Type holder and generators collection for Portal Users used for tests.
 */
export class PortalUser {
  public id?: string;
  public email: string;
  public password: string;
  public firstName: string;
  public lastName: string;

  public constructor(email = '') {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const fakeEmail = `ui_tests_${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Date.now()}.${faker.number.int()}@test.com`;

    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email || fakeEmail;
    // this.password = `Aa2${faker.internet.password({ length: 5, pattern: /[a-zA-Z0-9]/ })}`;
    this.password = `Aa2${faker.internet.password({ length: 10, pattern: /[a-zA-Z0-9]/ })}`;
  }
}
