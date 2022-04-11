/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { useEffect, useMemo, ReactElement } from 'react'

import Router from 'client/router'
import {
  ENDPOINTS,
  PATH,
  getEndpointsByView,
} from 'client/apps/sunstone/routes'
import { ENDPOINTS as ONE_ENDPOINTS } from 'client/apps/sunstone/routesOne'
import { ENDPOINTS as DEV_ENDPOINTS } from 'client/router/dev'

import { useAuth, useViews } from 'client/features/Auth'
import { useGeneralApi } from 'client/features/General'
import systemApi from 'client/features/OneApi/system'
import Sidebar from 'client/components/Sidebar'
import Notifier from 'client/components/Notifier'
import { AuthLayout } from 'client/components/HOC'
import { isDevelopment } from 'client/utils'
import { _APPS } from 'client/constants'

export const APP_NAME = _APPS.sunstone

/**
 * Sunstone App component.
 *
 * @returns {ReactElement} App rendered.
 */
const SunstoneApp = () => {
  const { changeAppTitle } = useGeneralApi()
  const { isLogged } = useAuth()
  const { views, view } = useViews()

  useEffect(() => {
    changeAppTitle(APP_NAME)
  }, [])

  const endpoints = useMemo(() => {
    const fixedEndpoints = [
      ...ENDPOINTS,
      ...(isDevelopment() ? DEV_ENDPOINTS : []),
    ]

    if (!view) return fixedEndpoints

    const viewEndpoints = getEndpointsByView(views?.[view], ONE_ENDPOINTS)

    return fixedEndpoints.concat(viewEndpoints)
  }, [view])

  return (
    <AuthLayout
      subscriptions={[
        systemApi.endpoints.getOneConfig,
        systemApi.endpoints.getSunstoneConfig,
        systemApi.endpoints.getSunstoneViews,
      ]}
    >
      {isLogged && (
        <>
          <Sidebar endpoints={endpoints} />
          <Notifier />
        </>
      )}
      <Router redirectWhenAuth={PATH.DASHBOARD} endpoints={endpoints} />
    </AuthLayout>
  )
}

SunstoneApp.displayName = '_SunstoneApp'

export default SunstoneApp
