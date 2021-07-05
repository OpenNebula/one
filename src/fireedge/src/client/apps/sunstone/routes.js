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
    Component: Dashboard
  },
  {
    label: 'Settings',
    path: PATH.SETTINGS,
    sidebar: true,
    icon: SettingsIcon,
    Component: Settings
  }
]

/**
 * @param {String} view Current view selected in redux (auth-reducer)
 * @param {Array} endpoints All endpoints of app
 * @returns {Array} Returns all endpoints available
 */
export const getEndpointsByView = (view, endpoints = []) => {
  const hasRoutePermission = route =>
    view?.some(({ resource_name: name }) =>
      route?.path.toLowerCase().endsWith(name.toLowerCase())
    ) && route

  return endpoints.map(({ routes: subRoutes, ...rest }) => {
    if (Array.isArray(subRoutes)) {
      const routes = subRoutes.map(hasRoutePermission).filter(Boolean)

      return !!routes.length && { ...rest, routes }
    }

    return hasRoutePermission(rest)
  }).filter(Boolean)
}

export default { PATH, ENDPOINTS }
