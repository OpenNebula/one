import {
  Dashboard as DashboardIcon,
  Ballot as BallotIcon,
  FormatListBulleted as TemplatesIcons,
  Apps as InstancesIcons,
  Public as ProvidersIcon,
  SettingsSystemDaydream as ProvisionsIcon
} from '@material-ui/icons'
import { matchPath } from 'react-router-dom'

import Login from 'client/containers/Login'
import Dashboard from 'client/containers/Dashboard'
import Settings from 'client/containers/Settings'
import TestApi from 'client/containers/TestApi'
import Webconsole from 'client/containers/Webconsole'

import ApplicationsTemplates from 'client/containers/ApplicationsTemplates'
import ApplicationsTemplatesCreateForm from 'client/containers/ApplicationsTemplates/Form/Create'

import ApplicationsInstances from 'client/containers/ApplicationsInstances'

import Providers from 'client/containers/Providers'
import Provisions from 'client/containers/Provisions'

export const PATH = {
  LOGIN: '/',
  DASHBOARD: '/dashboard',
  APPLICATIONS_TEMPLATES: {
    LIST: '/applications-templates',
    CREATE: '/applications-templates/create',
    EDIT: '/applications-templates/edit/:id'
  },
  APPLICATIONS: {
    LIST: '/applications'
  },
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

const ENDPOINTS = [
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
    label: 'Test API',
    path: PATH.TEST_API,
    authenticated: true,
    devMode: true,
    sidebar: true,
    icon: BallotIcon,
    component: TestApi
  },
  {
    label: 'Webconsole',
    path: '/webconsole',
    authenticated: true,
    devMode: true,
    sidebar: true,
    icon: BallotIcon,
    component: Webconsole
  },
  {
    label: 'Templates',
    path: PATH.APPLICATIONS_TEMPLATES.LIST,
    authenticated: true,
    sidebar: true,
    icon: TemplatesIcons,
    component: ApplicationsTemplates
  },
  {
    label: 'Create Application template',
    path: PATH.APPLICATIONS_TEMPLATES.CREATE,
    authenticated: true,
    component: ApplicationsTemplatesCreateForm
  },
  {
    label: 'Edit Application template',
    path: PATH.APPLICATIONS_TEMPLATES.EDIT,
    authenticated: true,
    component: ApplicationsTemplatesCreateForm
  },
  {
    label: 'Instances',
    path: PATH.APPLICATIONS.LIST,
    authenticated: true,
    sidebar: true,
    icon: InstancesIcons,
    component: ApplicationsInstances
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

export default ENDPOINTS
