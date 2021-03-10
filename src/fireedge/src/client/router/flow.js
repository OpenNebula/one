import {
  Dashboard as DashboardIcon,
  FormatListBulleted as TemplatesIcons,
  Apps as InstancesIcons
} from '@material-ui/icons'
import loadable from '@loadable/component'

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
    Component: loadable(() => import('client/containers/Login'))
  },
  {
    label: 'Dashboard',
    path: PATH.DASHBOARD,
    authenticated: true,
    sidebar: true,
    icon: DashboardIcon,
    Component: loadable(() => import('client/containers/Dashboard'))
  },
  {
    label: 'Settings',
    path: PATH.SETTINGS,
    authenticated: true,
    header: true,
    Component: loadable(() => import('client/containers/Settings'), { ssr: false })
  },
  {
    label: 'Templates',
    path: PATH.APPLICATIONS_TEMPLATES.LIST,
    authenticated: true,
    sidebar: true,
    icon: TemplatesIcons,
    Component: loadable(() => import('client/containers/ApplicationsTemplates'), { ssr: false })
  },
  {
    label: 'Create Application template',
    path: PATH.APPLICATIONS_TEMPLATES.CREATE,
    authenticated: true,
    Component: loadable(() => import('client/containers/ApplicationsTemplates/Form/Create'), { ssr: false })
  },
  {
    label: 'Edit Application template',
    path: PATH.APPLICATIONS_TEMPLATES.EDIT,
    authenticated: true,
    Component: loadable(() => import('client/containers/ApplicationsTemplates/Form/Create'), { ssr: false })
  },
  {
    label: 'Instances',
    path: PATH.APPLICATIONS.LIST,
    authenticated: true,
    sidebar: true,
    icon: InstancesIcons,
    Component: loadable(() => import('client/containers/ApplicationsInstances'), { ssr: false })
  }
]

export default { PATH, ENDPOINTS }
