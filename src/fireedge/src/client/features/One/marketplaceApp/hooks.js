import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { unwrapResult } from '@reduxjs/toolkit'

import * as actions from 'client/features/One/marketplaceApp/actions'

export const useMarketplaceApp = () => (
  useSelector(state => state.one.apps)
)

export const useMarketplaceAppApi = () => {
  const dispatch = useDispatch()

  const unwrapDispatch = useCallback(
    action => dispatch(action).then(unwrapResult)
    , [dispatch]
  )

  return {
    getMarketplaceApp: id => unwrapDispatch(actions.getMarketplaceApp({ id })),
    getMarketplaceApps: () => unwrapDispatch(actions.getMarketplaceApps())
  }
}
