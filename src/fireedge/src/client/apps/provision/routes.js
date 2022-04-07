/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
  DatabaseSettings as ProvidersIcon,
  SettingsCloud as ProvisionsIcon,
  Settings as SettingsIcon,
} from 'iconoir-react'

import loadable from '@loadable/component'

const Dashboard = loadable(
  () => import('client/containers/Dashboard/Provision'),
  { ssr: false }
)

const Providers = loadable(() => import('client/containers/Providers'), {
  ssr: false,
})
const CreateProvider = loadable(
  () => import('client/containers/Providers/Create'),
  { ssr: false }
)

const Provisions = loadable(() => import('client/containers/Provisions'), {
  ssr: false,
})
const CreateProvision = loadable(
  () => import('client/containers/Provisions/Create'),
  { ssr: false }
)

const Settings = loadable(() => import('client/containers/Settings'), {
  ssr: false,
})

export const PATH = {
  DASHBOARD: '/dashboard',
  PROVIDERS: {
    LIST: '/providers',
    CREATE: '/providers/create',
    EDIT: '/providers/edit/:id',
  },
  PROVISIONS: {
    LIST: '/provisions',
    CREATE: '/provisions/create',
    EDIT: '/provisions/edit/:id',
  },
  SETTINGS: '/settings',
}

export const ENDPOINTS = [
  {
    label: 'Dashboard',
    path: PATH.DASHBOARD,
    sidebar: true,
    icon: DashboardIcon,
    Component: Dashboard,
  },
  {
    label: 'Providers',
    path: PATH.PROVIDERS.LIST,
    sidebar: true,
    icon: ProvidersIcon,
    Component: Providers,
  },
  {
    label: 'Create Provider',
    path: PATH.PROVIDERS.CREATE,
    Component: CreateProvider,
  },
  {
    label: 'Edit Provider template',
    path: PATH.PROVIDERS.EDIT,
    Component: CreateProvider,
  },
  {
    label: 'Provisions',
    path: PATH.PROVISIONS.LIST,
    sidebar: true,
    icon: ProvisionsIcon,
    Component: Provisions,
  },
  {
    label: 'Create Provision',
    path: PATH.PROVISIONS.CREATE,
    Component: CreateProvision,
  },
  {
    label: 'Edit Provision template',
    path: PATH.PROVISIONS.EDIT,
    Component: CreateProvision,
  },
  {
    label: 'Settings',
    path: PATH.SETTINGS,
    sidebar: true,
    icon: SettingsIcon,
    Component: Settings,
  },
]

export default { PATH, ENDPOINTS }
