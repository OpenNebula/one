import { useCallback } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import { setApplications, setApplicationsTemplates } from 'client/actions/pool'

import { enqueueError, enqueueSuccess } from 'client/actions/general'

import * as serviceApplication from 'client/services/application'
import { filterBy } from 'client/utils/helpers'

export default function useOpennebula () {
  const dispatch = useDispatch()
  const {
    applications,
    applicationsTemplates,
    filterPool: filter
  } = useSelector(
    state => ({
      ...state?.Opennebula,
      filterPool: state?.Authenticated?.filterPool
    }),
    shallowEqual
  )

  const getApplication = useCallback(
    ({ id }) =>
      serviceApplication.getApplication({ id }).catch(err => {
        dispatch(enqueueError(err ?? `Error GET (${id}) application`))
      }),
    [dispatch]
  )

  const getApplications = useCallback(
    ({ end, start } = { end: -1, start: -1 }) =>
      serviceApplication
        .getApplications({ filter, end, start })
        .then(doc => dispatch(setApplications(doc)))
        .catch(err => {
          dispatch(enqueueError(err ?? 'Error GET applications'))
        }),
    [dispatch, filter, applications]
  )

  const getApplicationTemplate = useCallback(
    ({ id }) =>
      serviceApplication.getTemplate({ id }).catch(err => {
        dispatch(enqueueError(err ?? `Error GET (${id}) application template`))
      }),
    [dispatch]
  )

  const getApplicationsTemplates = useCallback(
    ({ end, start } = { end: -1, start: -1 }) =>
      serviceApplication
        .getTemplates({ filter, end, start })
        .then(doc => dispatch(setApplicationsTemplates(doc)))
        .catch(err => {
          dispatch(enqueueError(err ?? 'Error GET applications templates'))
        }),
    [dispatch, filter, applicationsTemplates]
  )

  const createApplicationTemplate = useCallback(
    ({ data }) =>
      serviceApplication
        .createTemplate({ data })
        .then(doc => {
          dispatch(
            setApplicationsTemplates(
              filterBy([doc].concat(applicationsTemplates), 'ID')
            )
          )

          return dispatch(enqueueSuccess(`Template created - ID: ${doc.ID}`))
        })
        .catch(err => {
          dispatch(
            enqueueError(err?.message ?? 'Error CREATE application template')
          )
        }),
    [dispatch, applicationsTemplates]
  )

  const updateApplicationTemplate = useCallback(
    ({ id, data }) =>
      serviceApplication
        .updateTemplate({ id, data })
        .then(doc => {
          dispatch(
            setApplicationsTemplates(
              filterBy([doc].concat(applicationsTemplates), 'ID')
            )
          )

          return dispatch(enqueueSuccess(`Template updated - ID: ${doc.ID}`))
        })
        .catch(err => {
          dispatch(
            enqueueError(err?.message ?? 'Error UPDATE application template')
          )
        }),
    [dispatch]
  )

  const instantiateApplicationTemplate = useCallback(
    ({ id, data }) =>
      serviceApplication
        .instantiateTemplate({ id, data })
        .then(doc => {
          dispatch(
            setApplicationsTemplates(
              filterBy([doc].concat(applicationsTemplates), 'ID')
            )
          )

          return dispatch(enqueueSuccess(`Template instantiate - ID: ${doc.ID}`))
        })
        .catch(err => {
          dispatch(
            enqueueError(err?.message ?? 'Error INSTANTIATE application template')
          )
        }),
    [dispatch]
  )

  return {
    applications,
    getApplication,
    getApplications,

    applicationsTemplates,
    getApplicationTemplate,
    getApplicationsTemplates,
    createApplicationTemplate,
    updateApplicationTemplate,
    instantiateApplicationTemplate
  }
}
