import {
  Dashboard as DashboardIcon,
  FormatListBulleted as TemplatesIcons,
  Apps as InstancesIcons
} from '@material-ui/icons'

import loadable from '@loadable/component'

const Login = loadable(() => import('client/containers/Login'), { ssr: false })

const Dashboard = loadable(() => import('client/containers/Dashboard'), { ssr: false })
const Settings = loadable(() => import('client/containers/Settings'), { ssr: false })
const ApplicationsTemplates = loadable(() => import('client/containers/ApplicationsTemplates'), { ssr: false })
const ApplicationsInstances = loadable(() => import('client/containers/ApplicationsInstances'), { ssr: false })

const ApplicationsTemplatesFormCreate = loadable(
  () => import('client/containers/ApplicationsTemplates/Form/Create'),
  { ssr: false }
)

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
    Component: ApplicationsTemplatesFormCreate
  },
  {
    label: 'Edit Application template',
    path: PATH.APPLICATIONS_TEMPLATES.EDIT,
    authenticated: true,
    Component: ApplicationsTemplatesFormCreate
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
