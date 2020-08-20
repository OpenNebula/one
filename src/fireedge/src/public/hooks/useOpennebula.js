import { useCallback } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';

import {
  setGroups,
  setUsers,
  startOneRequest,
  failureOneRequest
} from 'client/actions/pool';
import * as servicesGroups from 'client/services/groups';
import * as servicesUsers from 'client/services/users';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default function useOpennebula() {
  const dispatch = useDispatch();
  const { groups, users } = useSelector(
    state => state?.Opennebula,
    shallowEqual
  );

  const getGroups = useCallback(() => {
    dispatch(startOneRequest());
    return delay(2000).then(() =>
      servicesGroups
        .getGroups()
        .then(data => dispatch(setGroups(data)))
        .catch(() => dispatch(failureOneRequest('Unauthorized')))
    );
  }, [dispatch]);

  const getUsers = useCallback(() => {
    dispatch(startOneRequest());
    return delay(2000).then(() =>
      servicesUsers
        .getUsers()
        .then(data => dispatch(setUsers(data)))
        .catch(() => dispatch(failureOneRequest('Unauthorized')))
    );
  }, [dispatch]);

  return {
    groups,
    getGroups,
    users,
    getUsers
  };
}
