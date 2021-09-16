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
import { ENDPOINTS, PATH } from 'client/apps/provision/routes'
import { ENDPOINTS as DEV_ENDPOINTS } from 'client/router/dev'

import { useGeneralApi } from 'client/features/General'
import { useAuth, useAuthApi } from 'client/features/Auth'
import { useProvisionTemplate, useProvisionApi } from 'client/features/One'

import Sidebar from 'client/components/Sidebar'
import Notifier from 'client/components/Notifier'
import LoadingScreen from 'client/components/LoadingScreen'
import { _APPS } from 'client/constants'
import { isDevelopment } from 'client/utils'

const APP_NAME = _APPS.provision.name

/**
 * Provision App component.
 *
 * @returns {JSXElementConstructor} App rendered.
 */
const ProvisionApp = () => {
  const { isLogged, jwt, firstRender, providerConfig } = useAuth()
  const { getAuthUser, logout, getProviderConfig } = useAuthApi()

  const provisionTemplate = useProvisionTemplate()
  const { getProvisionsTemplates } = useProvisionApi()
  const { changeAppTitle } = useGeneralApi()

  useEffect(() => {
    (async () => {
      try {
        if (jwt) {
          changeAppTitle(APP_NAME)
          getAuthUser()
          !providerConfig && await getProviderConfig()
          !provisionTemplate?.length && await getProvisionsTemplates()
        }
      } catch {
        logout()
      }
    })()
  }, [jwt])

  const endpoints = useMemo(() => [
    ...ENDPOINTS,
    ...(isDevelopment() ? DEV_ENDPOINTS : [])
  ], [])

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

ProvisionApp.displayName = '_ProvisionApp'

export default ProvisionApp
