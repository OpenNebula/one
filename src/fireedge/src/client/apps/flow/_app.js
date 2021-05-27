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
import routes from 'client/apps/flow/routes'

import { useGeneralApi } from 'client/features/General'
import { useAuth, useAuthApi } from 'client/features/Auth'

import LoadingScreen from 'client/components/LoadingScreen'
import { fakeDelay } from 'client/utils'
import { _APPS, TIME_HIDE_LOGO } from 'client/constants'

const APP_NAME = _APPS.flow.name

const FlowApp = () => {
  const [firstRender, setFirstRender] = React.useState(() => true)

  const { jwt } = useAuth()
  const { getAuthUser } = useAuthApi()
  const { changeTitle } = useGeneralApi()

  React.useEffect(() => {
    if (firstRender) {
      jwt && (async () => {
        await getAuthUser()
      })()

      fakeDelay(TIME_HIDE_LOGO).then(() => setFirstRender(false))
    }
  }, [firstRender, jwt])

  React.useEffect(() => {
    changeTitle(APP_NAME)
  }, [])

  if (firstRender) {
    return <LoadingScreen />
  }

  return (
    <Router routes={routes} />
  )
}

FlowApp.displayName = '_FlowApp'

export default FlowApp
