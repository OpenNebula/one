import {
  List as TemplatesIcons,
  Cell4x4 as InstancesIcons
} from 'iconoir-react'

import loadable from '@loadable/component'

const ApplicationsTemplates = loadable(
  () => import('client/containers/ApplicationsTemplates'),
  { ssr: false }
)

const ApplicationsInstances = loadable(
  () => import('client/containers/ApplicationsInstances'),
  { ssr: false }
)

const ApplicationsTemplatesFormCreate = loadable(
  () => import('client/containers/ApplicationsTemplates/Form/Create'),
  { ssr: false }
)

export const PATH = {
  APPLICATIONS_TEMPLATES: {
    LIST: '/applications-templates',
    CREATE: '/applications-templates/create',
    EDIT: '/applications-templates/edit/:id'
  },
  APPLICATIONS: {
    LIST: '/applications'
  }
}

export const ENDPOINTS = [
  {
    label: 'Service Templates',
    path: PATH.APPLICATIONS_TEMPLATES.LIST,
    sidebar: true,
    icon: TemplatesIcons,
    Component: ApplicationsTemplates
  },
  {
    label: 'Create Application template',
    path: PATH.APPLICATIONS_TEMPLATES.CREATE,
    Component: ApplicationsTemplatesFormCreate
  },
  {
    label: 'Edit Application template',
    path: PATH.APPLICATIONS_TEMPLATES.EDIT,
    Component: ApplicationsTemplatesFormCreate
  },
  {
    label: 'Service Instances',
    path: PATH.APPLICATIONS.LIST,
    sidebar: true,
    icon: InstancesIcons,
    Component: ApplicationsInstances
  }
]

export default { PATH, ENDPOINTS }
