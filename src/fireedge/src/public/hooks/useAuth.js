import { useCallback, useEffect } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';

import { jwtName, FILTER_POOL, ONEADMIN_ID } from 'client/constants';
import { storage, findStorageData, removeStoreData } from 'client/utils';

import * as serviceAuth from 'client/services/auth';
import * as serviceUsers from 'client/services/users';
import * as serviceGroups from 'client/services/groups';
import {
  startAuth,
  selectFilterGroup,
  successAuth,
  failureAuth,
  logout as logoutRequest
} from 'client/actions/user';
import { setGroups } from 'client/actions/pool';

// function delay(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

export default function useAuth() {
  const {
    jwt,
    error,
    isLoginInProcess,
    isLoading,
    firstRender,
    filterPool,
    user: authUser
  } = useSelector(state => state?.Authenticated, shallowEqual);
  const baseURL = useSelector(state => state?.System?.baseURL, shallowEqual);
  const dispatch = useDispatch();

  useEffect(() => {
    const tokenStorage = findStorageData(jwtName);

    if ((tokenStorage && jwt && tokenStorage !== jwt) || firstRender)
      dispatch(successAuth({ jwt: tokenStorage }));
  }, [jwt, firstRender]);

  const login = useCallback(
    ({ remember, ...user }) => {
      dispatch(startAuth());

      return serviceAuth
        .login(user, baseURL)
        .then(data => {
          const { id, token } = data;
          dispatch(successAuth());

          if (token) {
            storage(jwtName, token, remember);
            dispatch(
              successAuth({
                jwt: token,
                user: { ID: id },
                isLoginInProcess: ONEADMIN_ID !== id // is not oneadmin
                // isLoading: ONEADMIN_ID !== id, // is not oneadmin
                // isLogging: ONEADMIN_ID !== id // is not oneadmin
              })
            );
          }

          return data;
        })
        .catch(err => {
          dispatch(failureAuth({ error: err }));
        });
    },
    [dispatch, baseURL, jwtName]
  );

  const logout = useCallback(() => {
    removeStoreData([jwtName]);
    dispatch(logoutRequest());
  }, [dispatch, jwtName]);

  const getAuthInfo = useCallback(() => {
    dispatch(startAuth());

    return serviceAuth
      .getUser(baseURL)
      .then(user =>
        serviceGroups.getGroups().then(groups => {
          dispatch(setGroups(groups));
          dispatch(successAuth({ user }));
        })
      )
      .catch(err => dispatch(failureAuth({ error: err })));
  }, [dispatch, baseURL, jwtName]);

  const setPrimaryGroup = useCallback(
    values => {
      if (values?.group === FILTER_POOL.ALL_RESOURCES) {
        dispatch(selectFilterGroup({ filterPool: FILTER_POOL.ALL_RESOURCES }));
      } else {
        dispatch(startAuth());

        serviceUsers
          .changeGroup({ id: authUser.ID, ...values })
          .then(() =>
            dispatch(
              selectFilterGroup({
                filterPool: FILTER_POOL.PRIMARY_GROUP_RESOURCES
              })
            )
          )
          .catch(err => dispatch(failureAuth({ error: err })));
      }
    },
    [dispatch, authUser, jwtName]
  );

  return {
    login,
    logout,
    getAuthInfo,
    setPrimaryGroup,
    authUser,
    isOneAdmin: authUser?.ID === ONEADMIN_ID,
    isLogged: Boolean(jwt),
    isLoginInProcess,
    isLoading,
    firstRender,
    error,
    filterPool
  };
}
