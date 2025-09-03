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
import {
  AuthLayout,
  ModalHost,
  Notifier,
  NotifierUpload,
  PATH,
  Sidebar,
  TranslateProvider,
} from '@ComponentsModule'
import { ENDPOINTS, getEndpointsByView } from 'client/apps/sunstone/routes'
import Router from 'client/router'
import { ENDPOINTS as DEV_ENDPOINTS } from 'client/router/dev'
import { ReactElement, useEffect, useMemo } from 'react'

import { _APPS, SERVER_CONFIG } from '@ConstantsModule'
import {
  oneApi,
  SupportAPI,
  SystemAPI,
  useAuth,
  useGeneralApi,
  useViews,
} from '@FeaturesModule'
import { isDevelopment, processTabManifest } from '@UtilsModule'

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
  const [getSupport, { isSuccess: isSupportSuccess }] =
    SupportAPI.useLazyCheckOfficialSupportQuery()
  const { changeAppTitle } = useGeneralApi()
  const { isLogged, externalRedirect } = useAuth()
  const { views, view } = useViews()

  const {
    data: tabManifest = {},
    isSuccess: isManifestLoaded,
    isLoading: isManifestLoading,
  } = SystemAPI.useGetTabManifestQuery()

  useEffect(() => {
    changeAppTitle(APP_NAME)
  }, [])

  useEffect(() => {
    if (view && SERVER_CONFIG?.token_remote_support) {
      getSupport()
    }
  }, [view, getSupport])

  const endpoints = useMemo(() => {
    const fixedEndpoints = [
      ...ENDPOINTS,
      ...(isDevelopment() ? DEV_ENDPOINTS : []),
    ]

    if (!view) return fixedEndpoints

    const viewEndpoints = getEndpointsByView(
      views?.[view],
      processTabManifest(tabManifest)
    )

    return showSupportTab(
      fixedEndpoints.concat(viewEndpoints),
      isSupportSuccess
    )
  }, [tabManifest, view, isSupportSuccess, isManifestLoaded, isManifestLoading])

  return (
    <TranslateProvider>
      <AuthLayout
        subscriptions={[
          oneApi.endpoints.getOneConfig,
          oneApi.endpoints.getSunstoneViews,
        ]}
      >
        {isLogged && (
          <>
            <Sidebar endpoints={endpoints} />
            <Notifier />
            <NotifierUpload />
            <ModalHost />
          </>
        )}
        <Router
          redirectWhenAuth={externalRedirect || PATH.DASHBOARD}
          endpoints={endpoints}
        />
      </AuthLayout>
    </TranslateProvider>
  )
}

SunstoneApp.displayName = '_SunstoneApp'

export default SunstoneApp
