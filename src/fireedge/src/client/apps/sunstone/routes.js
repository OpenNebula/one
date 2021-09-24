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
import {
  ReportColumns as DashboardIcon,
  Settings as SettingsIcon
} from 'iconoir-react'

import loadable from '@loadable/component'

const Dashboard = loadable(() => import('client/containers/Dashboard/Sunstone'), { ssr: false })
const Settings = loadable(() => import('client/containers/Settings'), { ssr: false })

export const PATH = {
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings'
}

export const ENDPOINTS = [
  {
    label: 'Dashboard',
    path: PATH.DASHBOARD,
    sidebar: true,
    icon: DashboardIcon,
    position: 1,
    Component: Dashboard
  },
  {
    label: 'Settings',
    path: PATH.SETTINGS,
    sidebar: true,
    icon: SettingsIcon,
    position: -1,
    Component: Settings
  }
]

/**
 * YAML file describes the information and actions available in the resource.
 *
 * @typedef {object} ResourceView - Resource view file selected in redux (auth-reducer)
 * @property {string} resource_name - Resource view name
 * @property {object} actions - Bulk actions, including dialogs
 * Which buttons are visible to operate over the resources
 * @property {object} filters - List of criteria to filter the resources
 * @property {object} info-tabs - Which info tabs are used to show extended information
 */

/**
 * @param {ResourceView[]} views - View of resources
 * @param {Array} endpoints - All endpoints of app
 * @returns {Array} Returns all endpoints available
 */
export const getEndpointsByView = (views, endpoints = []) => {
  /**
   * @param {object} route - Route from view yaml
   * @param {string} [route.path] - Pathname route
   * @returns {boolean | object} If user view yaml contains the route, return it
   */
  const hasRoutePermission = route =>
    views?.some(({ resource_name: name = '', actions: bulkActions = [] }) => {
      // eg: '/vm-template/instantiate' => ['vm-template', 'instantiate']
      const paths = route?.path
        ?.toLowerCase?.()
        ?.split?.('/')
        ?.filter?.(Boolean)

      const [resource, dialogName] = paths

      return dialogName && !dialogName.includes(':') // filter params. eg: '/vm/:id'
        ? bulkActions[`${dialogName}_dialog`]
        : resource === name.toLowerCase()
    }) && route

  return endpoints
    .map(({ routes: subRoutes, ...restOfProps }) => {
      if (Array.isArray(subRoutes)) {
        const routes = subRoutes.map(hasRoutePermission).filter(Boolean)

        return !!routes.length && { ...restOfProps, routes }
      }

      return hasRoutePermission(restOfProps)
    })
    .filter(Boolean)
}

export default { PATH, ENDPOINTS }
