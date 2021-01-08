import {
  Dashboard as DashboardIcon,
  FormatListBulleted as TemplatesIcons,
  Apps as InstancesIcons
} from '@material-ui/icons'

import Login from 'client/containers/Login'
import Dashboard from 'client/containers/Dashboard'
import Settings from 'client/containers/Settings'

import ApplicationsTemplates from 'client/containers/ApplicationsTemplates'
import ApplicationsTemplatesCreateForm from 'client/containers/ApplicationsTemplates/Form/Create'

import ApplicationsInstances from 'client/containers/ApplicationsInstances'

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
  SETTINGS: '/settings'
}

export const ENDPOINTS = [
  {
    label: 'Login',
    path: PATH.LOGIN,
    authenticated: false,
    Component: Login
  },
  {
    label: 'Dashboard',
    path: PATH.DASHBOARD,
    authenticated: true,
    sidebar: true,
    icon: DashboardIcon,
    Component: Dashboard
  },
  {
    label: 'Settings',
    path: PATH.SETTINGS,
    authenticated: true,
    header: true,
    Component: Settings
  },
  {
    label: 'Templates',
    path: PATH.APPLICATIONS_TEMPLATES.LIST,
    authenticated: true,
    sidebar: true,
    icon: TemplatesIcons,
    Component: ApplicationsTemplates
  },
  {
    label: 'Create Application template',
    path: PATH.APPLICATIONS_TEMPLATES.CREATE,
    authenticated: true,
    Component: ApplicationsTemplatesCreateForm
  },
  {
    label: 'Edit Application template',
    path: PATH.APPLICATIONS_TEMPLATES.EDIT,
    authenticated: true,
    Component: ApplicationsTemplatesCreateForm
  },
  {
    label: 'Instances',
    path: PATH.APPLICATIONS.LIST,
    authenticated: true,
    sidebar: true,
    icon: InstancesIcons,
    Component: ApplicationsInstances
  }
]

export default { PATH, ENDPOINTS }
