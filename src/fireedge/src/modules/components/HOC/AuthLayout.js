/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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

import { useAuthApi, oneApi, useAuth } from '@FeaturesModule'
import FullscreenProgress from '@modules/components/LoadingScreen'

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
  const { isSessionVerified } = useAuth()
  const { changeAuthUser } = useAuthApi()

  const { data: user = {} } = oneApi.endpoints.getAuthUser.useQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })

  useEffect(() => {
    if (!user?.ID) return
    changeAuthUser(user)

    const endpoints = [
      oneApi.endpoints.getGroups,
      oneApi.endpoints.getDefaultLabels,
      ...subscriptions,
    ].map((endpoint) =>
      dispatch(endpoint.initiate(undefined, { forceRefetch: true }))
    )

    return () => {
      endpoints.forEach((endpoint) => {
        endpoint.unsubscribe()
        endpoint.abort()
      })
    }
  }, [dispatch, user])

  const showLoading = !isSessionVerified

  if (showLoading) return <FullscreenProgress />

  return <>{children}</>
}

AuthLayout.propTypes = {
  subscriptions: PropTypes.array,
  children: PropTypes.any,
}

AuthLayout.displayName = 'AuthLayout'

export default AuthLayout
