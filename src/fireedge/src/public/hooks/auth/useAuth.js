import { useCallback, useEffect } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';

import { jwtName } from 'client/constants';
import { storage, findStorageData, removeStoreData } from 'client/utils';

import * as servicesAuth from 'client/services/auth';
import * as actions from 'client/actions/user';

export default function useAuth() {
  const { isLoading, jwt, user: authUser, firstRender, error } = useSelector(
    state => state?.Authenticated,
    shallowEqual
  );
  const baseURL = useSelector(state => state?.System?.baseURL, shallowEqual);
  const dispatch = useDispatch();

  useEffect(() => {
    const tokenStorage = findStorageData(jwtName);
    if ((tokenStorage !== jwt && tokenStorage && jwt) || firstRender)
      dispatch(actions.loginSuccess(tokenStorage));
  }, [jwt, firstRender]);

  const login = useCallback(
    (user, remember) => {
      dispatch(actions.loginRequest());

      servicesAuth
        .login(user, baseURL)
        .then(({ data }) => {
          storage(jwtName, data?.token, remember);
          dispatch(actions.loginSuccess(data?.token));
        })
        .catch(res => {
          removeStoreData(jwtName);
          dispatch(actions.loginFailure('Unauthenticated'));
        });
    },
    [baseURL, jwtName]
  );

  const logout = useCallback(() => {
    removeStoreData([jwtName]);
    dispatch(actions.logout());
  }, [jwtName]);

  const getAuthUser = useCallback(() => {
    dispatch(actions.userRequest());

    servicesAuth
      .getUser()
      .then(({ data }) => dispatch(actions.userSuccess(data?.USER)))
      .catch(message => {
        removeStoreData([jwtName]);
        dispatch(actions.userFailure(message));
      });
  }, [dispatch]);

  return {
    login,
    logout,
    getAuthUser,
    authUser,
    isLogged: Boolean(jwt),
    isLoading,
    firstRender,
    error
  };
}
