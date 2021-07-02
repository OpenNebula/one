import { useCallback } from 'react'
import { useDispatch, useSelector, shallowEqual } from 'react-redux'
import { unwrapResult } from '@reduxjs/toolkit'

import * as actions from 'client/features/Auth/actions'
import * as actionsView from 'client/features/Auth/actionsView'

export const useAuth = () => {
  const auth = useSelector(state => state.auth, shallowEqual)
  const groups = useSelector(state => state.one.groups, shallowEqual)

  const { user, jwt } = auth

  const userGroups = [user?.GROUPS?.ID]
    .flat()
    .map(id => groups.find(({ ID }) => ID === id))
    .filter(Boolean)

  const isLogged = !!jwt && !!userGroups?.length

  return { ...auth, groups: userGroups, isLogged }
}

export const useAuthApi = () => {
  const dispatch = useDispatch()

  const unwrapDispatch = useCallback(
    action => dispatch(action).then(unwrapResult)
    , [dispatch]
  )

  return {
    login: user => unwrapDispatch(actions.login(user)),
    getAuthUser: () => dispatch(actions.getUser()),
    changeGroup: data => unwrapDispatch(actions.changeGroup(data)),
    logout: () => dispatch(actions.logout()),

    getSunstoneViews: () => unwrapDispatch(actionsView.getSunstoneViews()),
    changeView: data => dispatch(actionsView.changeView(data))
  }
}
