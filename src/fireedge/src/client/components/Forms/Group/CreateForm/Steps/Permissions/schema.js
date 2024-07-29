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
import { INPUT_TYPES, T } from 'client/constants'
import { getObjectSchemaFromFields } from 'client/utils'
import { boolean, object } from 'yup'

const VIEW_VM = {
  name: 'view.VM',
  label: T.VMs,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const VIEW_HOST = {
  name: 'view.HOST',
  label: T.Host,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const VIEW_NET = {
  name: 'view.NET',
  label: T.VirtualNetworks,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const VIEW_IMAGE = {
  name: 'view.IMAGE',
  label: T.Image,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const VIEW_USER = {
  name: 'view.USER',
  label: T.User,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const VIEW_TEMPLATE = {
  name: 'view.TEMPLATE',
  label: T.Template,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const VIEW_GROUP = {
  name: 'view.GROUP',
  label: T.Group,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const VIEW_DATASTORE = {
  name: 'view.DATASTORE',
  label: T.Datastore,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const VIEW_CLUSTER = {
  name: 'view.CLUSTER',
  label: T.Cluster,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const VIEW_DOCUMENT = {
  name: 'view.DOCUMENT',
  label: T.Services,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const VIEW_ZONE = {
  name: 'view.ZONE',
  label: T.Zone,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const VIEW_SECURITY_GROUP = {
  name: 'view.SECGROUP',
  label: T.SecurityGroup,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const VIEW_VDC = {
  name: 'view.VDC',
  label: T.VDC,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const VIEW_VROUTER = {
  name: 'view.VROUTER',
  label: T.VirtualRouter,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const VIEW_MARKETPLACE = {
  name: 'view.MARKETPLACE',
  label: T.Marketplace,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const VIEW_MARKETPLACEAPP = {
  name: 'view.MARKETPLACEAPP',
  label: T.Apps,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const VIEW_VMGROUP = {
  name: 'view.VMGROUP',
  label: T.VMGroup,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const VIEW_VNTEMPLATE = {
  name: 'view.VNTEMPLATE',
  label: T.NetworkTemplate,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const PERMISSIONS_VIEW_FIELDS = [VIEW_VM, VIEW_DOCUMENT]
const PERMISSIONS_VIEW_SCHEMA = getObjectSchemaFromFields(
  PERMISSIONS_VIEW_FIELDS
)

const PERMISSIONS_VIEW_FIELDS_ADVANCED = [
  VIEW_HOST,
  VIEW_NET,
  VIEW_IMAGE,
  VIEW_USER,
  VIEW_TEMPLATE,
  VIEW_GROUP,
  VIEW_DATASTORE,
  VIEW_CLUSTER,
  VIEW_ZONE,
  VIEW_SECURITY_GROUP,
  VIEW_VDC,
  VIEW_VROUTER,
  VIEW_MARKETPLACE,
  VIEW_MARKETPLACEAPP,
  VIEW_VMGROUP,
  VIEW_VNTEMPLATE,
]
const PERMISSIONS_VIEW_SCHEMA_ADVANCED = getObjectSchemaFromFields(
  PERMISSIONS_VIEW_FIELDS_ADVANCED
)

export {
  PERMISSIONS_VIEW_FIELDS,
  PERMISSIONS_VIEW_SCHEMA,
  PERMISSIONS_VIEW_FIELDS_ADVANCED,
  PERMISSIONS_VIEW_SCHEMA_ADVANCED,
}

const CREATE_VM = {
  name: 'create.VM',
  label: T.VMs,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => true),
  grid: { md: 12 },
}

const CREATE_HOST = {
  name: 'create.HOST',
  label: T.Host,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const CREATE_NET = {
  name: 'create.NET',
  label: T.VirtualNetworks,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const CREATE_IMAGE = {
  name: 'create.IMAGE',
  label: T.Image,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => true),
  grid: { md: 12 },
}

const CREATE_USER = {
  name: 'create.USER',
  label: T.User,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const CREATE_TEMPLATE = {
  name: 'create.TEMPLATE',
  label: T.Template,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => true),
  grid: { md: 12 },
}

const CREATE_GROUP = {
  name: 'create.GROUP',
  label: T.Group,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const CREATE_DATASTORE = {
  name: 'create.DATASTORE',
  label: T.Datastore,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const CREATE_CLUSTER = {
  name: 'create.CLUSTER',
  label: T.Cluster,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const CREATE_DOCUMENT = {
  name: 'create.DOCUMENT',
  label: T.Services,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => true),
  grid: { md: 12 },
}

const CREATE_ZONE = {
  name: 'create.ZONE',
  label: T.Zone,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const CREATE_SECURITY_GROUP = {
  name: 'create.SECGROUP',
  label: T.SecurityGroup,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => true),
  grid: { md: 12 },
}

const CREATE_VDC = {
  name: 'create.VDC',
  label: T.VDC,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const CREATE_VROUTER = {
  name: 'create.VROUTER',
  label: T.VirtualRouter,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => true),
  grid: { md: 12 },
}

const CREATE_MARKETPLACE = {
  name: 'create.MARKETPLACE',
  label: T.Marketplace,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const CREATE_MARKETPLACEAPP = {
  name: 'create.MARKETPLACEAPP',
  label: T.Apps,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const CREATE_VMGROUP = {
  name: 'create.VMGROUP',
  label: T.VMGroup,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const CREATE_VNTEMPLATE = {
  name: 'create.VNTEMPLATE',
  label: T.NetworkTemplate,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const PERMISSIONS_CREATE_FIELDS = [
  CREATE_VM,
  CREATE_NET,
  CREATE_SECURITY_GROUP,
  CREATE_VROUTER,
  CREATE_IMAGE,
  CREATE_TEMPLATE,
  CREATE_DOCUMENT,
]
const PERMISSIONS_CREATE_SCHEMA = getObjectSchemaFromFields(
  PERMISSIONS_CREATE_FIELDS
)

const PERMISSIONS_CREATE_FIELDS_ADVANCED = [
  CREATE_HOST,
  CREATE_USER,
  CREATE_GROUP,
  CREATE_DATASTORE,
  CREATE_CLUSTER,
  CREATE_ZONE,
  CREATE_VDC,
  CREATE_MARKETPLACE,
  CREATE_MARKETPLACEAPP,
  CREATE_VMGROUP,
  CREATE_VNTEMPLATE,
]
const PERMISSIONS_CREATE_SCHEMA_ADVANCED = getObjectSchemaFromFields(
  PERMISSIONS_CREATE_FIELDS_ADVANCED
)

export {
  PERMISSIONS_CREATE_FIELDS,
  PERMISSIONS_CREATE_SCHEMA,
  PERMISSIONS_CREATE_FIELDS_ADVANCED,
  PERMISSIONS_CREATE_SCHEMA_ADVANCED,
}

/**
 * @returns {object} I/O schema
 */
export const SCHEMA = () =>
  object()
    .concat(PERMISSIONS_VIEW_SCHEMA)
    .concat(PERMISSIONS_VIEW_SCHEMA_ADVANCED)
    .concat(PERMISSIONS_CREATE_SCHEMA)
    .concat(PERMISSIONS_CREATE_SCHEMA_ADVANCED)
