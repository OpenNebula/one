import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { unwrapResult } from '@reduxjs/toolkit'

import * as actions from 'client/features/One/user/actions'

export const useUser = () => (
  useSelector(state => state.one.users)
)

export const useUserApi = () => {
  const dispatch = useDispatch()

  const unwrapDispatch = useCallback(
    action => dispatch(action).then(unwrapResult)
    , [dispatch]
  )

  return {
    changeGroup: data => unwrapDispatch(actions.changeGroup({ data })),
    getUser: id => unwrapDispatch(actions.getUser({ id })),
    getUsers: () => unwrapDispatch(actions.getUsers()),
    updateUser: data => unwrapDispatch(actions.updateUser({ data }))
  }
}
