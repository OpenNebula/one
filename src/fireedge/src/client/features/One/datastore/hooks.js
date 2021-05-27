import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { unwrapResult } from '@reduxjs/toolkit'

import * as actions from 'client/features/One/datastore/actions'

export const useDatastore = () => (
  useSelector(state => state.one.datastores)
)

export const useDatastoreApi = () => {
  const dispatch = useDispatch()

  const unwrapDispatch = useCallback(
    action => dispatch(action).then(unwrapResult)
    , [dispatch]
  )

  return {
    getDatastore: id => unwrapDispatch(actions.getDatastore({ id })),
    getDatastores: () => unwrapDispatch(actions.getDatastores())
  }
}
