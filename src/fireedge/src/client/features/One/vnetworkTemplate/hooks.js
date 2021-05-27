import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { unwrapResult } from '@reduxjs/toolkit'

import * as actions from 'client/features/One/vnetworkTemplate/actions'

export const useVNetworkTemplate = () => (
  useSelector(state => state.one.vNetworksTemplates)
)

export const useVNetworkTemplateApi = () => {
  const dispatch = useDispatch()

  const unwrapDispatch = useCallback(
    action => dispatch(action).then(unwrapResult)
    , [dispatch]
  )

  return {
    getVNetworkTemplate: id => unwrapDispatch(actions.getVNetworkTemplate({ id })),
    getVNetworksTemplates: () => unwrapDispatch(actions.getVNetworksTemplates())
  }
}
