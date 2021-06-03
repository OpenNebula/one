import {
  ReportColumns as DashboardIcon,
  DatabaseSettings as ProvidersIcon,
  SettingsCloud as ProvisionsIcon,
  Settings as SettingsIcon
} from 'iconoir-react'

import loadable from '@loadable/component'

const Dashboard = loadable(() => import('client/containers/Dashboard/Provision'), { ssr: false })

const Providers = loadable(() => import('client/containers/Providers'), { ssr: false })
const ProvidersFormCreate = loadable(() => import('client/containers/Providers/Form/Create'), { ssr: false })

const Provisions = loadable(() => import('client/containers/Provisions'), { ssr: false })
const ProvisionsFormCreate = loadable(() => import('client/containers/Provisions/Form/Create'), { ssr: false })

const Settings = loadable(() => import('client/containers/Settings'), { ssr: false })

export const PATH = {
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
    label: 'Dashboard',
    path: PATH.DASHBOARD,
    sidebar: true,
    icon: DashboardIcon,
    Component: Dashboard
  },
  {
    label: 'Providers',
    path: PATH.PROVIDERS.LIST,
    sidebar: true,
    icon: ProvidersIcon,
    Component: Providers
  },
  {
    label: 'Create Provider',
    path: PATH.PROVIDERS.CREATE,
    Component: ProvidersFormCreate
  },
  {
    label: 'Edit Provider template',
    path: PATH.PROVIDERS.EDIT,
    Component: ProvidersFormCreate
  },
  {
    label: 'Provisions',
    path: PATH.PROVISIONS.LIST,
    sidebar: true,
    icon: ProvisionsIcon,
    Component: Provisions
  },
  {
    label: 'Create Provision',
    path: PATH.PROVISIONS.CREATE,
    Component: ProvisionsFormCreate
  },
  {
    label: 'Edit Provision template',
    path: PATH.PROVISIONS.EDIT,
    Component: ProvisionsFormCreate
  },
  {
    label: 'Settings',
    path: PATH.SETTINGS,
    sidebar: true,
    icon: SettingsIcon,
    Component: Settings
  }
]

export default { PATH, ENDPOINTS }
