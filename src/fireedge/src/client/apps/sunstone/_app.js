/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { useEffect, useMemo, JSXElementConstructor } from 'react'

import Router from 'client/router'
import { ENDPOINTS, PATH, getEndpointsByView } from 'client/apps/sunstone/routes'
import { ENDPOINTS as ONE_ENDPOINTS } from 'client/apps/sunstone/routesOne'
import { ENDPOINTS as DEV_ENDPOINTS } from 'client/router/dev'

import { useGeneralApi } from 'client/features/General'
import { useAuth, useAuthApi } from 'client/features/Auth'

import Sidebar from 'client/components/Sidebar'
import Notifier from 'client/components/Notifier'
import LoadingScreen from 'client/components/LoadingScreen'
import { _APPS } from 'client/constants'
import { isDevelopment } from 'client/utils'

const APP_NAME = _APPS.sunstone.name

/**
 * Sunstone App component.
 *
 * @returns {JSXElementConstructor} App rendered.
 */
const SunstoneApp = () => {
  const { isLogged, jwt, firstRender, view, views } = useAuth()
  const { getAuthUser, logout, getSunstoneViews, getSunstoneConfig } = useAuthApi()
  const { changeAppTitle } = useGeneralApi()

  useEffect(() => {
    (async () => {
      try {
        if (jwt) {
          changeAppTitle(APP_NAME)
          getAuthUser()
          await getSunstoneViews()
          await getSunstoneConfig()
        }
      } catch {
        logout()
      }
    })()
  }, [jwt])

  const endpoints = useMemo(() => [
    ...ENDPOINTS,
    ...(view ? getEndpointsByView(views?.[view], ONE_ENDPOINTS) : []),
    ...(isDevelopment() ? DEV_ENDPOINTS : [])
  ], [view])

  if (jwt && firstRender) {
    return <LoadingScreen />
  }

  return (
    <>
      {isLogged && (
        <>
          <Sidebar endpoints={endpoints} />
          <Notifier />
        </>
      )}
      <Router redirectWhenAuth={PATH.DASHBOARD} endpoints={endpoints} />
    </>
  )
}

SunstoneApp.displayName = '_SunstoneApp'

export default SunstoneApp
