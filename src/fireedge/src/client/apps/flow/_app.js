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
import routes from 'client/router/flow'

import { _APPS } from 'client/constants'

const APP_NAME = _APPS.flow.name

const FlowApp = () => {
  /* if (process?.env?.NODE_ENV === 'development') {
    import('client/apps/_dev/routes').then(devRoutes => {
      routes = {
        PATH: { ...routes.PATH, ...devRoutes.PATH },
        ENDPOINTS: routes.ENDPOINTS.concat(devRoutes.ENDPOINTS)
      }
    })
  } */

  return <Router title={APP_NAME} routes={routes} />
}

FlowApp.displayName = '_FlowApp'

export default FlowApp
