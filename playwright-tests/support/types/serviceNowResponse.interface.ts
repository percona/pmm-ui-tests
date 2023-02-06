interface ServiceNowResponse {
  account: Account;
  contacts: Contacts;
}

interface Contacts {
  admin1: ServiceNowUser;
  admin2: ServiceNowUser;
  technical: ServiceNowUser;
}

interface ServiceNowUser {
  email: string;
  firstName: string;
  lastName: string;
}
interface Account {
  sys_id: string;
  name: string;
}
export default ServiceNowResponse;
