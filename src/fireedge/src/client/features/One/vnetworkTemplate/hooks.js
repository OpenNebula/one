import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { unwrapResult } from '@reduxjs/toolkit'

import * as actions from 'client/features/One/vnetworkTemplate/actions'
import { RESOURCES } from 'client/features/One/slice'

export const useVNetworkTemplate = () => (
  useSelector(state => state.one[RESOURCES.vntemplate])
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
