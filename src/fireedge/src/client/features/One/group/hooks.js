import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { unwrapResult } from '@reduxjs/toolkit'

import * as actions from 'client/features/One/group/actions'
import { RESOURCES } from 'client/features/One/slice'

export const useGroup = () => (
  useSelector(state => state.one[RESOURCES.group])
)

export const useGroupApi = () => {
  const dispatch = useDispatch()

  const unwrapDispatch = useCallback(
    action => dispatch(action).then(unwrapResult)
    , [dispatch]
  )

  return {
    getGroup: id => unwrapDispatch(actions.getGroup({ id })),
    getGroups: () => unwrapDispatch(actions.getGroups())
  }
}
