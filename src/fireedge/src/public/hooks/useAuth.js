import { useCallback, useEffect } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';

import { jwtName, FILTER_POOL, ONEADMIN_ID } from 'client/constants';
import { storage, findStorageData, removeStoreData } from 'client/utils';
import { fakeDelay } from 'client/utils/helpers';

import * as serviceAuth from 'client/services/auth';
import * as serviceUsers from 'client/services/users';
import * as servicePool from 'client/services/pool';
import {
  startAuth,
  selectFilterGroup,
  successAuth,
  failureAuth,
  logout as logoutRequest
} from 'client/actions/user';
import { setGroups } from 'client/actions/pool';

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
  const dispatch = useDispatch();

  useEffect(() => {
    const tokenStorage = findStorageData(jwtName);

    if ((tokenStorage && jwt && tokenStorage !== jwt) || firstRender) {
      fakeDelay(1500).then(() => dispatch(successAuth({ jwt: tokenStorage })));
    }
  }, [jwt, firstRender]);

  const login = useCallback(
    ({ remember, ...user }) => {
      dispatch(startAuth());

      return serviceAuth
        .login(user)
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
    [dispatch, jwtName]
  );

  const logout = useCallback(() => {
    removeStoreData([jwtName]);
    dispatch(logoutRequest());
  }, [dispatch, jwtName]);

  const getAuthInfo = useCallback(() => {
    dispatch(startAuth());

    return serviceAuth
      .getUser()
      .then(user => dispatch(successAuth({ user })))
      .then(servicePool.getGroups)
      .then(groups => dispatch(setGroups(groups)))
      .catch(err => dispatch(failureAuth({ error: err })));
  }, [dispatch, jwtName, authUser]);

  const setPrimaryGroup = useCallback(
    ({ group }) => {
      if (group === FILTER_POOL.ALL_RESOURCES) {
        dispatch(selectFilterGroup({ filterPool: FILTER_POOL.ALL_RESOURCES }));
      } else {
        dispatch(startAuth());

        serviceUsers
          .changeGroup({ id: authUser.ID, group })
          .then(() =>
            dispatch(
              selectFilterGroup({
                filterPool: FILTER_POOL.PRIMARY_GROUP_RESOURCES
              })
            )
          )
          .then(getAuthInfo)
          .catch(err => dispatch(failureAuth({ error: err })));
      }
    },
    [dispatch, authUser]
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
