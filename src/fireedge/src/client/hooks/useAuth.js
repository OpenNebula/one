import { useCallback, useEffect } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import { JWT_NAME, FILTER_POOL, ONEADMIN_ID } from 'client/constants'
import { storage, findStorageData, removeStoreData } from 'client/utils'
import { fakeDelay } from 'client/utils/helpers'

import * as serviceAuth from 'client/services/auth'
import * as serviceOne from 'client/services/one'

import {
  startAuth,
  selectFilterGroup,
  successAuth,
  failureAuth,
  logout as logoutRequest
} from 'client/actions/user'
import { setGroups } from 'client/actions/pool'

export default function useAuth () {
  const {
    jwt,
    error,
    isLoginInProcess,
    isLoading,
    firstRender,
    filterPool,
    user: authUser
  } = useSelector(state => state?.Authenticated, shallowEqual)
  const dispatch = useDispatch()

  useEffect(() => {
    const tokenStorage = findStorageData(JWT_NAME)

    if ((tokenStorage && jwt && tokenStorage !== jwt) || firstRender) {
      fakeDelay(1500).then(() => dispatch(successAuth({ jwt: tokenStorage })))
    }
  }, [jwt, firstRender])

  const login = useCallback(
    ({ remember, ...user }) => {
      dispatch(startAuth())

      return serviceAuth
        .login(user)
        .then(data => {
          const { id, token } = data
          dispatch(successAuth())

          if (token) {
            storage(JWT_NAME, token, remember)
            dispatch(
              successAuth({
                jwt: token,
                user: { ID: id },
                isLoginInProcess: ONEADMIN_ID !== id // is not oneadmin
              })
            )
          }

          return data
        })
        .catch(err => {
          dispatch(failureAuth({ error: err }))
        })
    },
    [dispatch, JWT_NAME]
  )

  const logout = useCallback(() => {
    removeStoreData([JWT_NAME])
    dispatch(logoutRequest())
  }, [dispatch, JWT_NAME])

  const getAuthInfo = useCallback(() => {
    dispatch(startAuth())

    return serviceAuth
      .getUser()
      .then(user => dispatch(successAuth({ user })))
      .then(serviceOne.getGroups)
      .then(groups => dispatch(setGroups(groups)))
      .catch(err => dispatch(failureAuth({ error: err })))
  }, [dispatch, JWT_NAME, authUser])

  const setPrimaryGroup = useCallback(
    ({ group }) => {
      if (group === FILTER_POOL.ALL_RESOURCES) {
        dispatch(selectFilterGroup({ filterPool: FILTER_POOL.ALL_RESOURCES }))
      } else {
        dispatch(startAuth())

        serviceOne
          .changeGroup({ id: authUser.ID, group })
          .then(() =>
            dispatch(
              selectFilterGroup({
                filterPool: FILTER_POOL.PRIMARY_GROUP_RESOURCES
              })
            )
          )
          .then(getAuthInfo)
          .catch(err => dispatch(failureAuth({ error: err })))
      }
    },
    [dispatch, authUser]
  )

  return {
    login,
    logout,
    getAuthInfo,
    setPrimaryGroup,
    authUser,
    isOneAdmin: authUser?.ID === ONEADMIN_ID,
    isLogged: Boolean(jwt),
    isLoginInProcess,
    isLoading,
    firstRender,
    error,
    filterPool
  }
}
