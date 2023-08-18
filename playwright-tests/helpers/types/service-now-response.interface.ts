export interface ServiceNowResponse {
  account: Account;
  contacts: Contacts;
}

interface Account {
  sys_id: string;
  name: string;
}

interface Contacts {
  admin1: ServiceNowUser;
  admin2: ServiceNowUser;
  technical: ServiceNowUser;
}

export interface ServiceNowUser {
  email: string;
  firstName: string;
  lastName: string;
}
