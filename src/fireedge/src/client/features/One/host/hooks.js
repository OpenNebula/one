import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { unwrapResult } from '@reduxjs/toolkit'

import * as actions from 'client/features/One/host/actions'

export const useHost = () => (
  useSelector(state => state.one.hosts)
)

export const useHostApi = () => {
  const dispatch = useDispatch()

  const unwrapDispatch = useCallback(
    action => dispatch(action).then(unwrapResult)
    , [dispatch]
  )

  return {
    getHost: id => unwrapDispatch(actions.getHost({ id })),
    getHosts: () => unwrapDispatch(actions.getHosts())
  }
}
