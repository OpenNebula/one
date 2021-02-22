import { useCallback, useEffect } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import { JWT_NAME, FILTER_POOL, ONEADMIN_ID, TIME_HIDE_LOGO } from 'client/constants'
import { storage, findStorageData, removeStoreData, fakeDelay } from 'client/utils'

import * as serviceAuth from 'client/services/auth'
import * as serviceOne from 'client/services/one'

import {
  startAuth,
  selectFilterGroup,
  updateSetting,
  successAuth,
  failureAuth,
  logout as logoutRequest
} from 'client/actions/user'
import { setGroups } from 'client/actions/pool'
import { enqueueError, enqueueSuccess, closeSnackbar } from 'client/actions/general'

const useAuth = () => {
  const {
    jwt,
    error,
    isLoginInProcess,
    isLoading,
    firstRender,
    filterPool,
    user: authUser,
    settings
  } = useSelector(state => state?.Authenticated, shallowEqual)
  const dispatch = useDispatch()

  useEffect(() => {
    const tokenStorage = findStorageData(JWT_NAME)

    if ((tokenStorage && jwt && tokenStorage !== jwt) || firstRender) {
      fakeDelay(TIME_HIDE_LOGO).then(() => dispatch(successAuth({ jwt: tokenStorage })))
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
          dispatch(closeSnackbar())

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
      .then(() => dispatch(updateSetting))
      .then(() => serviceOne.getGroups())
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

  const updateUser = useCallback(
    ({ template }) =>
      serviceOne
        .updateUser({ id: authUser.ID, template })
        .then(() => dispatch(enqueueSuccess(`User updated - ID: ${authUser.ID}`)))
        .then(getAuthInfo)
        .catch(err => {
          dispatch(enqueueError(err ?? 'Error update user'))
          throw err
        })
    , [dispatch, authUser]
  )

  return {
    login,
    logout,
    getAuthInfo,
    setPrimaryGroup,
    updateUser,
    isLogged: !!jwt,
    authUser,
    settings,
    isOneAdmin: authUser?.ID === ONEADMIN_ID,
    isLoginInProcess,
    isLoading,
    firstRender,
    error,
    filterPool
  }
}

export default useAuth
