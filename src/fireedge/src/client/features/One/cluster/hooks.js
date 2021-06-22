import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { unwrapResult } from '@reduxjs/toolkit'

import * as actions from 'client/features/One/cluster/actions'
import { RESOURCES } from 'client/features/One/slice'

export const useCluster = () => (
  useSelector(state => state.one[RESOURCES.cluster])
)

export const useClusterApi = () => {
  const dispatch = useDispatch()

  const unwrapDispatch = useCallback(
    action => dispatch(action).then(unwrapResult)
    , [dispatch]
  )

  return {
    getCluster: id => unwrapDispatch(actions.getCluster({ id })),
    getClusters: () => unwrapDispatch(actions.getClusters())
  }
}
