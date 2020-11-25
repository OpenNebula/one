import { useCallback } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import {
  setProvidersTemplates,
  setProviders,
  setProvisionsTemplates,
  setProvisions
} from 'client/actions/pool'

import { enqueueError, enqueueSuccess } from 'client/actions/general'

import * as serviceProvision from 'client/services/provision'

export default function useOpennebula () {
  const dispatch = useDispatch()
  const {
    providersTemplates,
    providers,
    provisionsTemplates,
    provisions,
    filterPool: filter
  } = useSelector(
    state => ({
      ...state?.Opennebula,
      filterPool: state?.Authenticated?.filterPool
    }),
    shallowEqual
  )

  // --------------------------------------------
  // PROVIDERS TEMPLATES REQUESTS
  // --------------------------------------------

  const getProvidersTemplates = useCallback(
    ({ end, start } = { end: -1, start: -1 }) =>
      serviceProvision
        .getProvidersTemplates({ filter, end, start })
        .then(doc => {
          dispatch(setProvidersTemplates(doc))
          return doc
        })
        .catch(err => {
          dispatch(enqueueError(err ?? 'Error GET providers templates'))
        }),
    [dispatch, filter, providersTemplates]
  )

  // --------------------------------------------
  // PROVIDERS REQUESTS
  // --------------------------------------------

  const getProvider = useCallback(
    ({ id }) =>
      serviceProvision.getProvider({ id }).catch(err => {
        dispatch(enqueueError(err ?? `Error GET (${id}) provider`))
      }),
    [dispatch]
  )

  const getProviders = useCallback(
    ({ end, start } = { end: -1, start: -1 }) =>
      serviceProvision
        .getProviders({ filter, end, start })
        .then(doc => {
          dispatch(setProviders(doc))
          return doc
        })
        .catch(err => {
          dispatch(enqueueError(err ?? 'Error GET providers'))
          return err
        }),
    [dispatch, filter]
  )

  const createProvider = useCallback(
    ({ data }) =>
      serviceProvision
        .createProvider({ data })
        .then(id => dispatch(enqueueSuccess(`Provider created - ID: ${id}`)))
        .catch(err => dispatch(enqueueError(err ?? 'Error CREATE provider')))
    , [dispatch, providers]
  )

  const updateProvider = useCallback(
    ({ id, data }) =>
      serviceProvision
        .updateProvider({ id, data })
        .then(() => dispatch(enqueueSuccess(`Provider updated - ID: ${id}`)))
        .catch(err => dispatch(enqueueError(err ?? 'Error UPDATE provider')))
    , [dispatch, providers]
  )

  const deleteProvider = useCallback(
    ({ id }) =>
      serviceProvision
        .deleteProvider({ id })
        .then(() => {
          dispatch(enqueueSuccess(`Provider deleted - ID: ${id}`))
          dispatch(setProviders(providers.filter(({ ID }) => ID !== id)))
        })
        .catch(err => dispatch(enqueueError(err ?? 'Error DELETE provider')))
    , [dispatch, providers]
  )

  // --------------------------------------------
  // PROVISIONS TEMPLATES REQUESTS
  // --------------------------------------------

  const getProvisionsTemplates = useCallback(
    ({ end, start } = { end: -1, start: -1 }) =>
      serviceProvision
        .getProvisionsTemplates({ filter, end, start })
        .then(doc => {
          dispatch(setProvisionsTemplates(doc))
          return doc
        })
        .catch(err => {
          dispatch(enqueueError(err ?? 'Error GET provisions templates'))
        }),
    [dispatch, filter]
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
        .getProvisions({ filter, end, start })
        .then(doc => {
          dispatch(setProvisions(doc))
          return doc
        })
        .catch(err => {
          dispatch(enqueueError(err?.message ?? 'Error GET provisions'))
          return err
        }),
    [dispatch, filter]
  )

  const createProvision = useCallback(
    ({ data }) =>
      serviceProvision
        .createProvision({ data })
        .then(doc => dispatch(
          enqueueSuccess(`Provision created - ID: ${doc?.ID}`))
        )
        .catch(err => {
          dispatch(
            enqueueError(err?.message ?? 'Error CREATE Provision')
          )
        }),
    [dispatch, provisions]
  )

  const deleteProvision = useCallback(
    ({ id }) =>
      serviceProvision
        .deleteProvision({ id })
        .then(() => dispatch(enqueueSuccess(`Provision deleted - ID: ${id}`)))
        .catch(err => dispatch(enqueueError(err ?? 'Error DELETE provision')))
    , [dispatch, provisions]
  )

  return {
    providersTemplates,
    getProvidersTemplates,

    providers,
    getProvider,
    getProviders,
    createProvider,
    updateProvider,
    deleteProvider,

    provisionsTemplates,
    getProvisionsTemplates,

    provisions,
    getProvision,
    getProvisions,
    createProvision,
    deleteProvision
  }
}
