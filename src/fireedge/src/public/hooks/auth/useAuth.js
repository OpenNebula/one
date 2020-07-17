import { useCallback, useState } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';

import { jwtName } from 'client/constants';
import { storage, findStorageData, removeStoreData } from 'client/utils';

import { loginService, authUserService } from 'client/services/auth';
import actions from 'client/actions/opennebula';

export default function useAuth() {
  const [jwt, setJwt] = useState(() => findStorageData(jwtName));
  const authUser = useSelector(state => state?.Opennebula?.user, shallowEqual);
  const baseURL = useSelector(state => state?.System?.baseURL, shallowEqual);
  const dispatch = useDispatch();

  const setUser = useCallback(
    user => dispatch({ type: actions.SET_USER, payload: user }),
    [dispatch]
  );

  const login = useCallback(
    (user, remember) =>
      loginService(user, baseURL)
        .then(({ data }) => {
          storage(jwtName, data?.token, remember);
          setJwt(data?.token);
        })
        .catch(err => {
          setJwt(null);
          removeStoreData(jwtName);
          console.error('Error (login service)', err);
        }),
    [jwtName, baseURL]
  );

  const logout = useCallback(() => {
    removeStoreData([jwtName]);
    setUser(null);
    setJwt(null);
  }, [jwtName]);

  const getAuthUser = useCallback(
    () =>
      authUserService()
        .then(({ data }) => setUser(data?.USER))
        .catch(err => {
          setJwt(null);
          removeStoreData([jwtName]);
          console.error('Error (auth user service)', err);
        }),
    [jwtName]
  );

  return {
    login,
    logout,
    //setUser,
    getAuthUser,
    authUser,
    jwt,
    isLogged: Boolean(authUser)
  };
}
