/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

import * as React from 'react'

import Router from 'client/router'
import routes from 'client/apps/provision/routes'

import { useGeneralApi } from 'client/features/General'
import { useAuth, useAuthApi } from 'client/features/Auth'
import { useProvisionTemplate, useProvisionApi } from 'client/features/One'

import LoadingScreen from 'client/components/LoadingScreen'
import { _APPS } from 'client/constants'

const APP_NAME = _APPS.provision.name

const ProvisionApp = () => {
  const { jwt, firstRender } = useAuth()
  const { getAuthUser, logout } = useAuthApi()

  const provisionTemplate = useProvisionTemplate()
  const { getProvisionsTemplates } = useProvisionApi()
  const { changeTitle } = useGeneralApi()

  React.useEffect(() => {
    (async () => {
      try {
        if (jwt) {
          getAuthUser()
          !provisionTemplate?.length && await getProvisionsTemplates()
        }
      } catch {
        logout()
      }
    })()
  }, [jwt])

  React.useEffect(() => {
    changeTitle(APP_NAME)
  }, [])

  if (jwt && firstRender) {
    return <LoadingScreen />
  }

  return <Router routes={routes} />
}

ProvisionApp.displayName = '_ProvisionApp'

export default ProvisionApp
