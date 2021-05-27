import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { unwrapResult } from '@reduxjs/toolkit'

import * as actions from 'client/features/One/provider/actions'

export const useProvider = () => (
  useSelector(state => state.one.providers)
)

export const useProviderApi = () => {
  const dispatch = useDispatch()

  const unwrapDispatch = useCallback(
    action => dispatch(action).then(unwrapResult)
    , [dispatch]
  )

  return {
    getProvider: id => unwrapDispatch(actions.getProvider({ id })),
    getProviders: () => dispatch(actions.getProviders()),
    getProviderConnection: id => unwrapDispatch(actions.getProviderConnection({ id })),
    createProvider: data => unwrapDispatch(actions.createProvider({ data })),
    updateProvider: (id, data) => unwrapDispatch(actions.updateProvider({ id, data })),
    deleteProvider: id => unwrapDispatch(actions.deleteProvider({ id }))
  }
}
