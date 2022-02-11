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
import { useEffect, useMemo, ReactElement } from 'react'

import Router from 'client/router'
import { ENDPOINTS, PATH } from 'client/apps/provision/routes'
import { ENDPOINTS as DEV_ENDPOINTS } from 'client/router/dev'

import { useGeneral, useGeneralApi } from 'client/features/General'
import { useAuth, useAuthApi } from 'client/features/Auth'
import provisionApi from 'client/features/OneApi/provision'
import providerApi from 'client/features/OneApi/provider'
import { useSocket } from 'client/hooks'

import Sidebar from 'client/components/Sidebar'
import Notifier from 'client/components/Notifier'
import LoadingScreen from 'client/components/LoadingScreen'
import { isDevelopment } from 'client/utils'
import { _APPS } from 'client/constants'

export const APP_NAME = _APPS.provision.name

const MESSAGE_PROVISION_SUCCESS_CREATED = 'Provision successfully created'

/**
 * Provision App component.
 *
 * @returns {ReactElement} App rendered.
 */
const ProvisionApp = () => {
  const { getProvisionSocket } = useSocket()
  const { isLogged, jwt, firstRender } = useAuth()
  const { getAuthUser, logout } = useAuthApi()

  const { appTitle, zone } = useGeneral()
  const { changeAppTitle, enqueueSuccess } = useGeneralApi()

  const queryProps = [undefined, { skip: !jwt }]
  provisionApi.endpoints.getProvisionTemplates.useQuery(...queryProps)
  providerApi.endpoints.getProviderConfig.useQuery(...queryProps)

  useEffect(() => {
    ;(async () => {
      appTitle !== APP_NAME && changeAppTitle(APP_NAME)

      try {
        jwt && getAuthUser()
      } catch {
        logout()
      }
    })()
  }, [jwt])

  useEffect(() => {
    if (!jwt || !zone) return

    const socket = getProvisionSocket((payload) => {
      const { command, data } = payload

      // Dispatch successfully notification when one provision is created
      if (command === 'create' && data === MESSAGE_PROVISION_SUCCESS_CREATED) {
        enqueueSuccess(MESSAGE_PROVISION_SUCCESS_CREATED)
      }
    })

    socket?.on()

    return () => socket?.off()
  }, [jwt, zone])

  const endpoints = useMemo(
    () => [...ENDPOINTS, ...(isDevelopment() ? DEV_ENDPOINTS : [])],
    []
  )

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
