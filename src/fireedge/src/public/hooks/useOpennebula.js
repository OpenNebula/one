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

export default function useOpennebula() {
  const dispatch = useDispatch();
  const { groups, users } = useSelector(
    state => state?.Opennebula,
    shallowEqual
  );

  const getGroups = useCallback(() => {
    dispatch(startOneRequest());
    return servicesGroups
      .getGroups()
      .then(data => dispatch(setGroups(data)))
      .catch(err => dispatch(failureOneRequest({ error: err })));
  }, [dispatch]);

  const getUsers = useCallback(() => {
    dispatch(startOneRequest());
    return servicesUsers
      .getUsers()
      .then(data => dispatch(setUsers(data)))
      .catch(err => dispatch(failureOneRequest({ error: err })));
  }, [dispatch]);

  return {
    groups,
    getGroups,
    users,
    getUsers
  };
}
