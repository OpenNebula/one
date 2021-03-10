import {
  Dashboard as DashboardIcon,
  Public as ProvidersIcon,
  SettingsSystemDaydream as ProvisionsIcon,
  Settings as SettingsIcon
} from '@material-ui/icons'
import loadable from '@loadable/component'

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
    Component: loadable(() => import('client/containers/Login'))
  },
  {
    label: 'Dashboard',
    path: PATH.DASHBOARD,
    authenticated: true,
    sidebar: true,
    icon: DashboardIcon,
    Component: loadable(() => import('client/containers/Dashboard/Provision'))
  },
  {
    label: 'Providers',
    path: PATH.PROVIDERS.LIST,
    authenticated: true,
    sidebar: true,
    icon: ProvidersIcon,
    Component: loadable(() => import('client/containers/Providers'), { ssr: false })
  },
  {
    label: 'Create Provider',
    path: PATH.PROVIDERS.CREATE,
    authenticated: true,
    Component: loadable(() => import('client/containers/Providers/Form/Create'), { ssr: false })
  },
  {
    label: 'Edit Provider template',
    path: PATH.PROVIDERS.EDIT,
    authenticated: true,
    Component: loadable(() => import('client/containers/Providers/Form/Create'), { ssr: false })
  },
  {
    label: 'Provisions',
    path: PATH.PROVISIONS.LIST,
    authenticated: true,
    sidebar: true,
    icon: ProvisionsIcon,
    Component: loadable(() => import('client/containers/Provisions'), { ssr: false })
  },
  {
    label: 'Create Provision',
    path: PATH.PROVISIONS.CREATE,
    authenticated: true,
    Component: loadable(() => import('client/containers/Provisions/Form/Create'), { ssr: false })
  },
  {
    label: 'Edit Provision template',
    path: PATH.PROVISIONS.EDIT,
    authenticated: true,
    Component: loadable(() => import('client/containers/Provisions/Form/Create'), { ssr: false })
  },
  {
    label: 'Settings',
    path: PATH.SETTINGS,
    authenticated: true,
    sidebar: true,
    icon: SettingsIcon,
    Component: loadable(() => import('client/containers/Settings'), { ssr: false })
  }
]

export default { PATH, ENDPOINTS }
