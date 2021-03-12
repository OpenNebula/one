import {
  Dashboard as DashboardIcon,
  Public as ProvidersIcon,
  SettingsSystemDaydream as ProvisionsIcon,
  Settings as SettingsIcon
} from '@material-ui/icons'

import loadable from '@loadable/component'

const Login = loadable(() => import('client/containers/Login'), { ssr: false })
const Dashboard = loadable(() => import('client/containers/Dashboard/Provision'), { ssr: false })

const Providers = loadable(() => import('client/containers/Providers'), { ssr: false })
const ProvidersFormCreate = loadable(() => import('client/containers/Providers/Form/Create'), { ssr: false })

const Provisions = loadable(() => import('client/containers/Provisions'), { ssr: false })
const ProvisionsFormCreate = loadable(() => import('client/containers/Provisions/Form/Create'), { ssr: false })

const Settings = loadable(() => import('client/containers/Settings'), { ssr: false })

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
    Component: ProvidersFormCreate
  },
  {
    label: 'Edit Provider template',
    path: PATH.PROVIDERS.EDIT,
    authenticated: true,
    Component: ProvidersFormCreate
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
    Component: ProvisionsFormCreate
  },
  {
    label: 'Edit Provision template',
    path: PATH.PROVISIONS.EDIT,
    authenticated: true,
    Component: ProvisionsFormCreate
  },
  {
    label: 'Settings',
    path: PATH.SETTINGS,
    authenticated: true,
    sidebar: true,
    icon: SettingsIcon,
    Component: Settings
  }
]

export default { PATH, ENDPOINTS }
