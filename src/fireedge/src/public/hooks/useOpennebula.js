import { useCallback } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';

import actions, {
  startOneRequest,
  failureOneRequest
} from 'client/actions/pool';

import * as servicePool from 'client/services/pool';

export default function useOpennebula() {
  const dispatch = useDispatch();
  const {
    groups,
    users,
    vNetworks,
    vNetworksTemplates,
    templates,
    filterPool: filter
  } = useSelector(
    state => ({
      ...state?.Opennebula,
      filterPool: state?.Authenticated?.filterPool
    }),
    shallowEqual
  );

  const getGroups = useCallback(() => {
    dispatch(startOneRequest());
    return servicePool
      .getGroups({ filter })
      .then(data => dispatch(actions.setGroups(data)))
      .catch(err => dispatch(failureOneRequest({ error: err })));
  }, [dispatch, filter]);

  const getUsers = useCallback(() => {
    dispatch(startOneRequest());
    return servicePool
      .getUsers({ filter })
      .then(data => dispatch(actions.setUsers(data)))
      .catch(err => dispatch(failureOneRequest({ error: err })));
  }, [dispatch, filter]);

  const getVNetworks = useCallback(() => {
    dispatch(startOneRequest());
    return servicePool
      .getVNetworks({ filter })
      .then(data => dispatch(actions.setVNetworks(data)))
      .catch(err => dispatch(failureOneRequest({ error: err })));
  }, [dispatch, filter]);

  const getVNetworksTemplates = useCallback(() => {
    dispatch(startOneRequest());
    return servicePool
      .getVNetworksTemplates({ filter })
      .then(data => dispatch(actions.setVNetworkTemplates(data)))
      .catch(err => dispatch(failureOneRequest({ error: err })));
  }, [dispatch, filter]);

  const getTemplates = useCallback(() => {
    dispatch(startOneRequest());
    return servicePool
      .getTemplates({ filter })
      .then(data => dispatch(actions.setTemplates(data)))
      .catch(err => dispatch(failureOneRequest({ error: err })));
  }, [dispatch, filter]);

  return {
    groups,
    getGroups,
    users,
    getUsers,
    vNetworks,
    getVNetworks,
    vNetworksTemplates,
    getVNetworksTemplates,
    templates,
    getTemplates
  };
}
