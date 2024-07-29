/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
import { useEffect, ReactElement } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { useAuth, useAuthApi } from 'client/features/Auth'
import { oneApi } from 'client/features/OneApi'
import authApi from 'client/features/OneApi/auth'
import groupApi from 'client/features/OneApi/group'
import FullscreenProgress from 'client/components/LoadingScreen'
import { findStorageData, findExternalToken, storage } from 'client/utils'
import { JWT_NAME } from 'client/constants'

/**
 * Renders loading screen while validate JWT.
 *
 * @param {object} props - Props
 * @param {object[]} [props.subscriptions] - Subscriptions after login
 * @param {ReactElement} [props.children] - Children
 * @returns {ReactElement} App rendered.
 */
const AuthLayout = ({ subscriptions = [], children }) => {
  const dispatch = useDispatch()
  const { changeJwt, stopFirstRender } = useAuthApi()
  const { jwt, user, isLogged, isLoginInProgress, firstRender } = useAuth()

  useEffect(() => {
    if (!jwt) return

    const authSubscription = dispatch(
      authApi.endpoints.getAuthUser.initiate(undefined, { forceRefetch: true })
    )

    return () => {
      authSubscription.unsubscribe()
      dispatch(oneApi.util.resetApiState())
    }
  }, [dispatch, jwt])

  useEffect(() => {
    if (!jwt || !user?.NAME) return

    const endpoints = [groupApi.endpoints.getGroups, ...subscriptions].map(
      (endpoint) =>
        dispatch(endpoint.initiate(undefined, { forceRefetch: true }))
    )

    return () => {
      endpoints.forEach((endpoint) => {
        endpoint.unsubscribe()
        endpoint.abort()
      })
    }
  }, [dispatch, jwt, user?.NAME])

  useEffect(() => {
    if (!jwt) {
      const token = findExternalToken() || findStorageData(JWT_NAME)
      token && changeJwt(token) && storage(JWT_NAME, token)
    }

    // first rendering on client
    stopFirstRender()
  }, [])

  if ((jwt && !isLoginInProgress && !isLogged) || firstRender) {
    return <FullscreenProgress />
  }

  return <>{children}</>
}

AuthLayout.propTypes = {
  subscriptions: PropTypes.array,
  children: PropTypes.any,
}

AuthLayout.displayName = 'AuthLayout'

export default AuthLayout
