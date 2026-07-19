import { createContext } from 'react';

const UserContext = createContext({
  signedIn: false,
  givenName: '',
  name: '',
  email: '',
});

export default UserContext;
