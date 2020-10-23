import {
  Dashboard as DashboardIcon,
  Public as ProvidersIcon,
  SettingsSystemDaydream as ProvisionsIcon
} from '@material-ui/icons'
import { matchPath } from 'react-router-dom'

import Login from 'client/containers/Login'
import Dashboard from 'client/containers/Dashboard'
import Settings from 'client/containers/Settings'

import Providers from 'client/containers/Providers'
import Provisions from 'client/containers/Provisions'

export const PATH = {
  LOGIN: '/provision',
  DASHBOARD: '/dashboard',
  PROVIDERS: {
    LIST: '/providers',
    CREATE: '/providers/create',
    EDIT: '/providers/edit/:id'
  },
  PROVISIONS: {
    LIST: '/provisions',
    CREATE: '/provisions/create',
    EDIT: '/provisions/edit/:id'
  },
  SETTINGS: '/settings',
  TEST_API: '/test-api'
}

export const ENDPOINTS = [
  {
    label: 'Login',
    path: PATH.LOGIN,
    authenticated: false,
    component: Login
  },
  {
    label: 'Dashboard',
    path: PATH.DASHBOARD,
    authenticated: true,
    sidebar: true,
    icon: DashboardIcon,
    component: Dashboard
  },
  {
    label: 'Settings',
    path: PATH.SETTINGS,
    authenticated: true,
    header: true,
    component: Settings
  },
  {
    label: 'Providers',
    path: PATH.PROVIDERS.LIST,
    authenticated: true,
    sidebar: true,
    icon: ProvidersIcon,
    component: Providers
  },
  {
    label: 'Provisions',
    path: PATH.PROVISIONS.LIST,
    authenticated: true,
    sidebar: true,
    icon: ProvisionsIcon,
    component: Provisions
  }
]

export const findRouteByPathname = pathname => {
  const routes = ENDPOINTS.flatMap(
    ({ endpoints, ...item }) => endpoints ?? item
  )

  const route = routes?.find(({ path }) =>
    matchPath(pathname, { path, exact: true })
  )

  return route ?? {}
}
