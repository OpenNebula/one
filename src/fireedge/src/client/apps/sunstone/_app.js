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
import { ReactElement, useEffect, useMemo } from 'react'

import { ENDPOINTS, getEndpointsByView } from 'client/apps/sunstone/routes'
import {
  ENDPOINTS as ONE_ENDPOINTS,
  PATH,
} from 'client/apps/sunstone/routesOne'
import Router from 'client/router'
import { ENDPOINTS as DEV_ENDPOINTS } from 'client/router/dev'

import { AuthLayout } from 'client/components/HOC'
import Notifier from 'client/components/Notifier'
import NotifierUpload from 'client/components/Notifier/upload'
import Sidebar from 'client/components/Sidebar'
import { _APPS } from 'client/constants'
import { useAuth, useViews } from 'client/features/Auth'
import { useGeneralApi } from 'client/features/General'
import { useLazyCheckOfficialSupportQuery } from 'client/features/OneApi/support'
import systemApi from 'client/features/OneApi/system'
import { isDevelopment } from 'client/utils'

export const APP_NAME = _APPS.sunstone

const showSupportTab = (routes = [], find = true) => {
  if (find === true) return routes

  const supportTab = routes.findIndex((route) => route?.path === PATH.SUPPORT)
  if (supportTab >= 0) {
    routes.splice(supportTab, 1)
  }

  return routes
}

/**
 * Sunstone App component.
 *
 * @returns {ReactElement} App rendered.
 */
const SunstoneApp = () => {
  const [getSupport, { isSuccess }] = useLazyCheckOfficialSupportQuery()
  const { changeAppTitle } = useGeneralApi()
  const { isLogged } = useAuth()
  const { views, view } = useViews()

  useEffect(() => {
    changeAppTitle(APP_NAME)
  }, [])

  useEffect(() => {
    if (view) {
      getSupport()
    }
  }, [view, getSupport])

  const endpoints = useMemo(() => {
    const fixedEndpoints = [
      ...ENDPOINTS,
      ...(isDevelopment() ? DEV_ENDPOINTS : []),
    ]

    if (!view) return fixedEndpoints

    const viewEndpoints = getEndpointsByView(views?.[view], ONE_ENDPOINTS)

    return showSupportTab(fixedEndpoints.concat(viewEndpoints), isSuccess)
  }, [view, isSuccess])

  return (
    <AuthLayout
      subscriptions={[
        systemApi.endpoints.getOneConfig,
        systemApi.endpoints.getSunstoneViews,
      ]}
    >
      {isLogged && (
        <>
          <Sidebar endpoints={endpoints} />
          <Notifier />
          <NotifierUpload />
        </>
      )}
      <Router redirectWhenAuth={PATH.DASHBOARD} endpoints={endpoints} />
    </AuthLayout>
  )
}

SunstoneApp.displayName = '_SunstoneApp'

export default SunstoneApp
