import { useCallback } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import { setProvidersTemplates, setProviders, setProvisions } from 'client/actions/pool'

import { enqueueError, enqueueSuccess } from 'client/actions/general'

import * as serviceProvision from 'client/services/provision'

export default function useOpennebula () {
  const dispatch = useDispatch()
  const {
    providersTemplates,
    providers,
    provisions,
    filterPool: filter
  } = useSelector(
    state => ({
      ...state?.Opennebula,
      filterPool: state?.Authenticated?.filterPool
    }),
    shallowEqual
  )

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
        }),
    [dispatch, filter]
  )

  const createProvider = useCallback(
    ({ data }) =>
      serviceProvision
        .createProvider({ data })
        .then(doc => dispatch(
          enqueueSuccess(`Template created - ID: ${doc?.ID}`))
        )
        .catch(err => dispatch(
          enqueueError(err?.message ?? 'Error CREATE provider')
        )),
    [dispatch, providers]
  )

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
          dispatch(enqueueError(err ?? 'Error GET providers'))
        }),
    [dispatch, filter]
  )

  const createProvision = useCallback(
    ({ data }) =>
      serviceProvision
        .createProvision({ data })
        .then(doc => {
          /* dispatch(
            setApplicationsTemplates(
              filterBy([doc].concat(applicationsTemplates), 'ID')
            )
          ) */

          return dispatch(enqueueSuccess(`Template created - ID: ${doc?.ID}`))
        })
        .catch(err => {
          dispatch(
            enqueueError(err?.message ?? 'Error CREATE Provision')
          )
        }),
    [dispatch, provisions]
  )

  return {
    providersTemplates,
    getProvidersTemplates,

    providers,
    getProvider,
    getProviders,
    createProvider,

    provisions,
    getProvision,
    getProvisions,
    createProvision
  }
}
