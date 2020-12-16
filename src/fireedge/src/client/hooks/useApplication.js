import { useCallback } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import { setApplications, setApplicationsTemplates } from 'client/actions/pool'
import { enqueueError, enqueueSuccess } from 'client/actions/general'

import * as serviceFlow from 'client/services/flow'
import { filterBy } from 'client/utils'

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
      serviceFlow.getApplication({ id }).catch(err => {
        dispatch(enqueueError(err ?? `Error GET (${id}) application`))
      }),
    [dispatch]
  )

  const getApplications = useCallback(
    ({ end, start } = { end: -1, start: -1 }) =>
      serviceFlow
        .getApplications({ filter, end, start })
        .then(doc => dispatch(setApplications(doc)))
        .catch(err => {
          dispatch(enqueueError(err ?? 'Error GET applications'))
        }),
    [dispatch, filter, applications]
  )

  const getApplicationTemplate = useCallback(
    ({ id }) =>
      serviceFlow.getTemplate({ id }).catch(err => {
        dispatch(enqueueError(err ?? `Error GET (${id}) application template`))
      }),
    [dispatch]
  )

  const getApplicationsTemplates = useCallback(
    ({ end, start } = { end: -1, start: -1 }) =>
      serviceFlow
        .getTemplates({ filter, end, start })
        .then(doc => {
          dispatch(setApplicationsTemplates(doc))
          return doc
        })
        .catch(err => {
          dispatch(enqueueError(err ?? 'Error GET applications templates'))
        }),
    [dispatch, filter, applicationsTemplates]
  )

  const createApplicationTemplate = useCallback(
    ({ data }) =>
      serviceFlow
        .createTemplate({ data })
        .then(doc => {
          dispatch(
            setApplicationsTemplates(
              filterBy([doc].concat(applicationsTemplates), 'ID')
            )
          )
          dispatch(enqueueSuccess(`Template created - ID: ${doc.ID}`))
          return doc
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
      serviceFlow
        .updateTemplate({ id, data })
        .then(doc => {
          dispatch(
            setApplicationsTemplates(
              filterBy([doc].concat(applicationsTemplates), 'ID')
            )
          )
          dispatch(enqueueSuccess(`Template updated - ID: ${doc.ID}`))

          return doc
        })
        .catch(err => {
          dispatch(
            enqueueError(err?.message ?? 'Error UPDATE application template')
          )
        }),
    [dispatch]
  )

  const instantiateApplicationTemplate = useCallback(
    ({ id, data, instances }) => {
      const promises = [...new Array(instances)]
        .map(() => serviceFlow.instantiateTemplate({ id, data }))

      return Promise.all(promises)
        .then(docs => {
          dispatch(enqueueSuccess(`Template instantiate - x${instances}`))
          return docs
        })
        .catch(err => {
          dispatch(
            enqueueError(err?.message ?? 'Error INSTANTIATE application template')
          )
        })
    }
    , [dispatch]
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
