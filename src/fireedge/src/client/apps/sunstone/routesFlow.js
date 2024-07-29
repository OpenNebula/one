/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
  List as TemplatesIcons,
  Cell4X4 as InstancesIcons,
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
    EDIT: '/applications-templates/edit/:id',
  },
  APPLICATIONS: {
    LIST: '/applications',
  },
}

export const ENDPOINTS = [
  {
    label: 'Service Templates',
    path: PATH.APPLICATIONS_TEMPLATES.LIST,
    sidebar: true,
    icon: TemplatesIcons,
    Component: ApplicationsTemplates,
  },
  {
    label: 'Create Application template',
    path: PATH.APPLICATIONS_TEMPLATES.CREATE,
    Component: ApplicationsTemplatesFormCreate,
  },
  {
    label: 'Edit Application template',
    path: PATH.APPLICATIONS_TEMPLATES.EDIT,
    Component: ApplicationsTemplatesFormCreate,
  },
  {
    label: 'Service Instances',
    path: PATH.APPLICATIONS.LIST,
    sidebar: true,
    icon: InstancesIcons,
    Component: ApplicationsInstances,
  },
]

export default { PATH, ENDPOINTS }
