import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { unwrapResult } from '@reduxjs/toolkit'

import * as actions from 'client/features/One/cluster/actions'

export const useCluster = () => (
  useSelector(state => state.one.clusters)
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
