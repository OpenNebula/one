import {
  Dashboard as DashboardIcon,
  Public as ProvidersIcon,
  SettingsSystemDaydream as ProvisionsIcon
} from '@material-ui/icons'

import Login from 'client/containers/Login'
import Dashboard from 'client/containers/Dashboard/Provision'
import Settings from 'client/containers/Settings'

import Providers from 'client/containers/Providers'
import ProvidersCreateForm from 'client/containers/Providers/Form/Create'

import Provisions from 'client/containers/Provisions'
import ProvisionCreateForm from 'client/containers/Provisions/Form/Create'

export const PATH = {
  LOGIN: '/',
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
    label: 'Providers',
    path: PATH.PROVIDERS.LIST,
    authenticated: true,
    sidebar: true,
    icon: ProvidersIcon,
    Component: Providers
  },
  {
    label: 'Create Provider',
    path: PATH.PROVIDERS.CREATE,
    authenticated: true,
    Component: ProvidersCreateForm
  },
  {
    label: 'Edit Provider template',
    path: PATH.PROVIDERS.EDIT,
    authenticated: true,
    Component: ProvidersCreateForm
  },
  {
    label: 'Provisions',
    path: PATH.PROVISIONS.LIST,
    authenticated: true,
    sidebar: true,
    icon: ProvisionsIcon,
    Component: Provisions
  },
  {
    label: 'Create Provision',
    path: PATH.PROVISIONS.CREATE,
    authenticated: true,
    Component: ProvisionCreateForm
  },
  {
    label: 'Edit Provision template',
    path: PATH.PROVISIONS.EDIT,
    authenticated: true,
    Component: ProvisionCreateForm
  }
]

export default { PATH, ENDPOINTS }
