import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { unwrapResult } from '@reduxjs/toolkit'

import * as actions from 'client/features/One/vrouter/actions'
import { RESOURCES } from 'client/features/One/slice'

export const useVRouter = () => (
  useSelector(state => state.one[RESOURCES.vrouter])
)

export const useVRouterApi = () => {
  const dispatch = useDispatch()

  const unwrapDispatch = useCallback(
    action => dispatch(action).then(unwrapResult)
    , [dispatch]
  )

  return {
    getVRouter: id => unwrapDispatch(actions.getVRouter({ id })),
    getVRouters: () => unwrapDispatch(actions.getVRouters())
  }
}
