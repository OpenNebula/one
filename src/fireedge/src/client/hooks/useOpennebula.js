import { useCallback } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import actions, {
  startOneRequest,
  failureOneRequest
} from 'client/actions/pool'

import { filterBy } from 'client/utils'
import * as serviceOne from 'client/services/one'

export default function useOpennebula () {
  const dispatch = useDispatch()
  const {
    apps,
    clusters,
    datastores,
    hosts,
    groups,
    users,
    templates,
    vNetworks,
    vNetworksTemplates,
    filterPool: filter
  } = useSelector(
    state => ({
      ...state?.Opennebula,
      filterPool: state?.Authenticated?.filterPool
    }),
    shallowEqual
  )

  // --------------------------------------------
  // GROUPS REQUESTS
  // --------------------------------------------

  const getGroups = useCallback(() => {
    dispatch(startOneRequest())
    return serviceOne
      .getGroups({ filter })
      .then(data => dispatch(actions.setGroups(data)))
      .catch(err => dispatch(failureOneRequest({ error: err })))
  }, [dispatch, filter])

  // --------------------------------------------
  // USERS REQUESTS
  // --------------------------------------------

  const getUsers = useCallback(() => {
    dispatch(startOneRequest())
    return serviceOne
      .getUsers({ filter })
      .then(data => dispatch(actions.setUsers(data)))
      .catch(err => dispatch(failureOneRequest({ error: err })))
  }, [dispatch, filter])

  // --------------------------------------------
  // VIRTUAL NETWORKS REQUESTS
  // --------------------------------------------

  const getVNetworks = useCallback(() => {
    dispatch(startOneRequest())
    return serviceOne
      .getVNetworks({ filter })
      .then(data => dispatch(actions.setVNetworks(data)))
      .catch(err => dispatch(failureOneRequest({ error: err })))
  }, [dispatch, filter])

  const getVNetwork = useCallback(
    ({ id }) => {
      dispatch(startOneRequest())
      return serviceOne
        .getVNetwork({ filter, id })
        .catch(err => dispatch(failureOneRequest({ error: err })))
    },
    [dispatch, filter]
  )

  // --------------------------------------------
  // VIRTUAL NETWORKS TEMPLATES REQUESTS
  // --------------------------------------------

  const getVNetworksTemplates = useCallback(() => {
    dispatch(startOneRequest())
    return serviceOne
      .getVNetworksTemplates({ filter })
      .then(data => dispatch(actions.setVNetworksTemplates(data)))
      .catch(err => dispatch(failureOneRequest({ error: err })))
  }, [dispatch, filter])

  // --------------------------------------------
  // VM TEMPLATES REQUESTS
  // --------------------------------------------

  const getTemplates = useCallback(
    ({ end, start } = { end: -1, start: -1 }) => {
      dispatch(startOneRequest())
      return serviceOne
        .getTemplates({ filter, end, start })
        .then(data =>
          dispatch(actions.setTemplates(filterBy(templates.concat(data), 'ID')))
        )
        .catch(err => dispatch(failureOneRequest({ error: err })))
    },
    [dispatch, filter, templates]
  )

  const getTemplate = useCallback(
    ({ id }) => {
      dispatch(startOneRequest())
      return serviceOne
        .getTemplate({ filter, id })
        .catch(err => dispatch(failureOneRequest({ error: err })))
    },
    [dispatch, filter]
  )

  // --------------------------------------------
  // MARKETAPPS REQUESTS
  // --------------------------------------------

  const getMarketApps = useCallback(
    ({ end, start } = { end: -1, start: -1 }) => {
      dispatch(startOneRequest())
      return serviceOne
        .getMarketApps({ filter, end, start })
        .then(data =>
          dispatch(actions.setApps(filterBy(apps.concat(data), 'ID')))
        )
        .catch(err => dispatch(failureOneRequest({ error: err })))
    },
    [dispatch, filter, apps]
  )

  // --------------------------------------------
  // CLUSTERS REQUESTS
  // --------------------------------------------

  const getClusters = useCallback(() => {
    dispatch(startOneRequest())
    return serviceOne
      .getClusters({ filter })
      .then(data => {
        dispatch(actions.setClusters(data))
        return data
      })
      .catch(err => dispatch(failureOneRequest({ error: err })))
  }, [dispatch, filter])

  const getCluster = useCallback(
    ({ id }) => {
      dispatch(startOneRequest())
      return serviceOne
        .getCluster({ filter, id })
        .catch(err => dispatch(failureOneRequest({ error: err })))
    },
    [dispatch, filter]
  )

  // --------------------------------------------
  // DATASTORES REQUESTS
  // --------------------------------------------

  const getDatastores = useCallback(() => {
    dispatch(startOneRequest())
    return serviceOne
      .getDatastores({ filter })
      .then(data => {
        dispatch(actions.setDatastores(data))
        return data
      })
      .catch(err => dispatch(failureOneRequest({ error: err })))
  }, [dispatch, filter])

  const getDatastore = useCallback(
    ({ id }) => {
      dispatch(startOneRequest())
      return serviceOne
        .getDatastore({ filter, id })
        .catch(err => dispatch(failureOneRequest({ error: err })))
    },
    [dispatch, filter]
  )

  // --------------------------------------------
  // DATASTORES REQUESTS
  // --------------------------------------------

  const getHosts = useCallback(() => {
    dispatch(startOneRequest())
    return serviceOne
      .getHosts({ filter })
      .then(data => {
        dispatch(actions.setHosts(data))
        return data
      })
      .catch(err => dispatch(failureOneRequest({ error: err })))
  }, [dispatch, filter])

  const getHost = useCallback(
    ({ id }) => {
      dispatch(startOneRequest())
      return serviceOne
        .getHost({ filter, id })
        .catch(err => dispatch(failureOneRequest({ error: err })))
    },
    [dispatch, filter]
  )

  return {
    groups,
    getGroups,
    users,
    getUsers,
    vNetworks,
    getVNetworks,
    getVNetwork,
    vNetworksTemplates,
    getVNetworksTemplates,
    templates,
    getTemplates,
    getTemplate,
    apps,
    getMarketApps,
    clusters,
    getClusters,
    getCluster,
    datastores,
    getDatastores,
    getDatastore,
    hosts,
    getHosts,
    getHost
  }
}
