import { useCallback } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';

import actions, {
  startOneRequest,
  failureOneRequest
} from 'client/actions/pool';

import * as servicePool from 'client/services/pool';
import { filterBy } from 'client/utils/helpers';

export default function useOpennebula() {
  const dispatch = useDispatch();
  const {
    groups,
    users,
    vNetworks,
    vNetworksTemplates,
    templates,
    clusters,
    apps,
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

  const getTemplates = useCallback(
    ({ end, start } = { end: -1, start: -1 }) => {
      dispatch(startOneRequest());
      return servicePool
        .getTemplates({ filter, end, start })
        .then(data =>
          dispatch(actions.setTemplates(filterBy(templates.concat(data), 'ID')))
        )
        .catch(err => dispatch(failureOneRequest({ error: err })));
    },
    [dispatch, filter, templates]
  );

  const getMarketApps = useCallback(
    ({ end, start } = { end: -1, start: -1 }) => {
      dispatch(startOneRequest());
      return servicePool
        .getMarketApps({ filter, end, start })
        .then(data =>
          dispatch(actions.setApps(filterBy(apps.concat(data), 'ID')))
        )
        .catch(err => dispatch(failureOneRequest({ error: err })));
    },
    [dispatch, filter, apps]
  );

  const getClusters = useCallback(() => {
    dispatch(startOneRequest());
    return servicePool
      .getClusters({ filter })
      .then(data => dispatch(actions.setCluster(data)))
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
    getTemplates,
    apps,
    getMarketApps,
    clusters,
    getClusters
  };
}
