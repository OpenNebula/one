import { useCallback } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import {
  setProviders,
  setProvisions,
  setProvisionsTemplates,
  successOneRequest
} from 'client/actions/pool'

import { enqueueError, enqueueSuccess, enqueueInfo } from 'client/actions/general'

import * as serviceProvision from 'client/services/provision'

export default function useProvision () {
  const dispatch = useDispatch()
  const {
    providers,
    provisionsTemplates,
    provisions
  } = useSelector(({ Opennebula }) => Opennebula, shallowEqual)

  // --------------------------------------------
  // ALL PROVISION TEMPLATES REQUESTS
  // --------------------------------------------

  const getProvisionsTemplates = useCallback(
    () =>
      serviceProvision
        .getProvisionsTemplates({})
        .then(doc => {
          dispatch(setProvisionsTemplates(doc))
          return doc
        })
        .catch(err => {
          dispatch(enqueueError(err ?? 'Error GET templates'))
          throw err
        })
    , [dispatch]
  )

  const getProviderTemplateByDir = useCallback(
    ({ provision, provider, name } = {}) =>
      provisionsTemplates
        ?.[provision]
        ?.providers
        ?.[provider]
        ?.find(provider => provider.name === name)
    , [provisionsTemplates]
  )

  const getProvisionTemplateByDir = useCallback(
    ({ provision, provider, name } = {}) =>
      provisionsTemplates
        ?.[provision]
        ?.provisions
        ?.[provider]
        ?.find(provisionTemplate => provisionTemplate.name === name)
    , [provisionsTemplates]
  )

  // --------------------------------------------
  // PROVIDERS REQUESTS
  // --------------------------------------------

  const getProvider = useCallback(
    ({ id } = {}) =>
      serviceProvision
        .getProvider({ id })
        .then(doc => {
          dispatch(successOneRequest())
          return doc
        })
        .catch(err => {
          dispatch(enqueueError(err ?? `Error GET (${id}) provider`))
          throw err
        })
    , [dispatch]
  )

  const getProviders = useCallback(
    ({ end, start } = { end: -1, start: -1 }) =>
      serviceProvision
        .getProviders({ end, start })
        .then(doc => {
          dispatch(setProviders(doc))
          return doc
        })
        .catch(err => {
          dispatch(enqueueError(err ?? 'Error GET providers'))
          return err
        })
    , [dispatch]
  )

  const createProvider = useCallback(
    ({ data }) =>
      serviceProvision
        .createProvider({ data })
        .then(id => dispatch(enqueueSuccess(`Provider created - ID: ${id}`)))
        .catch(err => dispatch(enqueueError(err ?? 'Error CREATE provider')))
    , [dispatch]
  )

  const updateProvider = useCallback(
    ({ id, data }) =>
      serviceProvision
        .updateProvider({ id, data })
        .then(() => dispatch(enqueueSuccess(`Provider updated - ID: ${id}`)))
        .catch(err => dispatch(enqueueError(err ?? 'Error UPDATE provider')))
    , [dispatch]
  )

  const deleteProvider = useCallback(
    ({ id }) =>
      serviceProvision
        .deleteProvider({ id })
        .then(() => dispatch(enqueueSuccess(`Provider deleted - ID: ${id}`)))
        .then(() => getProviders())
        .catch(err => dispatch(enqueueError(err ?? 'Error DELETE provider'))),
    [dispatch]
  )

  const getProviderConnection = useCallback(
    ({ id }) =>
      serviceProvision
        .getProviderConnection({ id })
        .catch(err => {
          dispatch(enqueueError(err ?? `Error GET (${id}) provider connection`))
          throw err
        })
    , [dispatch]
  )

  // --------------------------------------------
  // PROVISIONS REQUESTS
  // --------------------------------------------

  const getProvision = useCallback(
    ({ id }) =>
      serviceProvision.getProvision({ id }).catch(err => {
        dispatch(enqueueError(err ?? `Error GET (${id}) provision`))
      }),
    [dispatch]
  )

  const getProvisions = useCallback(
    ({ end, start } = { end: -1, start: -1 }) =>
      serviceProvision
        .getProvisions({ end, start })
        .then(doc => {
          dispatch(setProvisions(doc))
          return doc
        })
        .catch(err => {
          dispatch(enqueueError(err?.message ?? 'Error GET provisions'))
          return err
        }),
    [dispatch]
  )

  const createProvision = useCallback(
    ({ data }) =>
      serviceProvision
        .createProvision({ data })
        .then(doc => {
          dispatch(enqueueInfo('Creating provision'))
          return doc.data
        })
        .catch(err => {
          dispatch(enqueueError(err?.message ?? 'Error creating provision'))
        }),
    [dispatch]
  )

  const configureProvision = useCallback(
    ({ id }) =>
      serviceProvision
        .configureProvision({ id })
        .then(doc => {
          dispatch(enqueueInfo(`Configuring provision - ID: ${id}`))
          return doc
        })
        .catch(err => dispatch(enqueueError(err ?? 'Error configuring provision')))
    , [dispatch]
  )

  const deleteProvision = useCallback(
    ({ id }) =>
      serviceProvision
        .deleteProvision({ id })
        .then(() => dispatch(enqueueInfo(`Deleting provision - ID: ${id}`)))
        .then(() => getProvisions())
        .catch(err => dispatch(enqueueError(err ?? 'Error deleting provision')))
    , [dispatch]
  )

  const getProvisionLog = useCallback(
    ({ id }) =>
      serviceProvision.getProvisionLog({ id }).catch(err => {
        dispatch(enqueueError(err ?? `Error GET (${id}) provision log`))
      }),
    [dispatch]
  )

  // --------------------------------------------
  // INFRASTRUCTURES REQUESTS
  // --------------------------------------------

  const deleteDatastore = useCallback(
    ({ id }) =>
      serviceProvision
        .deleteDatastore({ id })
        .then(doc => {
          dispatch(enqueueSuccess(`Datastore deleted - ID: ${id}`))
          return doc
        })
        .catch(err => dispatch(enqueueError(err ?? 'Error DELETE datastore')))
    , [dispatch]
  )

  const deleteVNetwork = useCallback(
    ({ id }) =>
      serviceProvision
        .deleteVNetwork({ id })
        .then(doc => {
          dispatch(enqueueSuccess(`VNetwork deleted - ID: ${id}`))
          return doc
        })
        .catch(err => dispatch(enqueueError(err ?? 'Error DELETE network')))
    , [dispatch]
  )

  const deleteHost = useCallback(
    ({ id }) =>
      serviceProvision
        .deleteHost({ id })
        .then(doc => {
          dispatch(enqueueSuccess(`Host deleted - ID: ${id}`))
          return doc
        })
        .catch(err => dispatch(enqueueError(err ?? 'Error DELETE host')))
    , [dispatch]
  )

  const configureHost = useCallback(
    ({ id }) =>
      serviceProvision
        .configureHost({ id })
        .then(doc => {
          dispatch(enqueueInfo(`Configuring host - ID: ${id}`))
          return doc
        })
        .catch(err => dispatch(enqueueError(err ?? 'Error CONFIGURE host')))
    , [dispatch]
  )

  return {
    getProvisionsTemplates,
    getProviderTemplateByDir,
    getProvisionTemplateByDir,
    provisionsTemplates,

    providers,
    getProvider,
    getProviders,
    createProvider,
    updateProvider,
    deleteProvider,
    getProviderConnection,

    provisions,
    getProvision,
    getProvisions,
    createProvision,
    configureProvision,
    deleteProvision,
    getProvisionLog,

    deleteDatastore,
    deleteVNetwork,
    deleteHost,
    configureHost
  }
}
