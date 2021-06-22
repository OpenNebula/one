import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { unwrapResult } from '@reduxjs/toolkit'

import * as actions from 'client/features/One/marketplace/actions'

export const useMarketplace = () => (
  useSelector(state => state.one.marketplaces)
)

export const useMarketplaceApi = () => {
  const dispatch = useDispatch()

  const unwrapDispatch = useCallback(
    action => dispatch(action).then(unwrapResult)
    , [dispatch]
  )

  return {
    getMarketplace: id => unwrapDispatch(actions.getMarketplace({ id })),
    getMarketplaces: () => unwrapDispatch(actions.getMarketplaces())
  }
}
