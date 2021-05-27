import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { unwrapResult } from '@reduxjs/toolkit'

import * as actions from 'client/features/One/vnetwork/actions'

export const useVNetwork = () => (
  useSelector(state => state.one.vNetworks)
)

export const useVNetworkApi = () => {
  const dispatch = useDispatch()

  const unwrapDispatch = useCallback(
    action => dispatch(action).then(unwrapResult)
    , [dispatch]
  )

  return {
    getVNetwork: id => unwrapDispatch(actions.getVNetwork({ id })),
    getVNetworks: () => unwrapDispatch(actions.getVNetworks())
  }
}
