import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { unwrapResult } from '@reduxjs/toolkit'

import * as actions from 'client/features/One/provision/actions'
import { RESOURCES } from 'client/features/One/slice'

export const useProvisionTemplate = () => (
  useSelector(state => state.one[RESOURCES.document.defaults])
)

export const useProvision = () => (
  useSelector(state => state.one[RESOURCES.document[103]])
)

export const useProvisionApi = () => {
  const dispatch = useDispatch()

  const unwrapDispatch = useCallback(
    action => dispatch(action).then(unwrapResult)
    , [dispatch]
  )

  return {
    getProvisionsTemplates: () => unwrapDispatch(actions.getProvisionsTemplates()),
    createProvisionTemplate: () => unwrapDispatch(actions.createProvisionTemplate()),

    getProvision: id => unwrapDispatch(actions.getProvision({ id })),
    getProvisions: () => dispatch(actions.getProvisions()),
    createProvision: data => unwrapDispatch(actions.createProvision({ data })),
    configureProvision: id => unwrapDispatch(actions.configureProvision({ id })),
    deleteProvision: id => unwrapDispatch(actions.deleteProvision({ id })),
    getProvisionLog: id => unwrapDispatch(actions.getProvisionLog({ id })),

    deleteDatastore: id => unwrapDispatch(actions.deleteDatastore({ id })),
    deleteVNetwork: id => unwrapDispatch(actions.deleteVNetwork({ id })),
    deleteHost: id => unwrapDispatch(actions.deleteHost({ id })),
    configureHost: id => unwrapDispatch(actions.configureHost({ id }))
  }
}
