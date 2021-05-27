import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { unwrapResult } from '@reduxjs/toolkit'

import * as actions from 'client/features/One/marketApp/actions'

export const useMarketApp = () => (
  useSelector(state => state.one.apps)
)

export const useMarketAppApi = () => {
  const dispatch = useDispatch()

  const unwrapDispatch = useCallback(
    action => dispatch(action).then(unwrapResult)
    , [dispatch]
  )

  return {
    getMarketApp: id => unwrapDispatch(actions.getMarketApp({ id })),
    getMarketApps: () => unwrapDispatch(actions.getMarketApps())
  }
}
