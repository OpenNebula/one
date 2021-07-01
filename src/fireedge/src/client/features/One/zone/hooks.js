import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { unwrapResult } from '@reduxjs/toolkit'

import * as actions from 'client/features/One/zone/actions'
import { RESOURCES } from 'client/features/One/slice'

export const useZone = () => (
  useSelector(state => state.one[RESOURCES.zone])
)

export const useZoneApi = () => {
  const dispatch = useDispatch()

  const unwrapDispatch = useCallback(
    action => dispatch(action).then(unwrapResult)
    , [dispatch]
  )

  return {
    getZone: id => unwrapDispatch(actions.getZone({ id })),
    getZones: () => unwrapDispatch(actions.getZones())
  }
}
