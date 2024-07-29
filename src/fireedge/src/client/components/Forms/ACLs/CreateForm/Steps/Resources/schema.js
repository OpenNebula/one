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
import { boolean } from 'yup'

const VM = {
  name: 'VM',
  label: T['acls.form.create.resources.vm'],
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 4 },
}

const DOCUMENT = {
  name: 'DOCUMENT',
  label: T.Service,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 4 },
}

const TEMPLATE = {
  name: 'TEMPLATE',
  label: T['acls.form.create.resources.vmtemplate'],
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 4 },
}

const VMGROUP = {
  name: 'VMGROUP',
  label: T.VMGroup,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 4 },
}

const DATASTORE = {
  name: 'DATASTORE',
  label: T.Datastore,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 4 },
}

const IMAGE = {
  name: 'IMAGE',
  label: T.Image,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 4 },
}

const MARKETPLACE = {
  name: 'MARKETPLACE',
  label: T.Marketplace,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 4 },
}

const MARKETPLACEAPP = {
  name: 'MARKETPLACEAPP',
  label: T.Apps,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 4 },
}

const BACKUPJOB = {
  name: 'BACKUPJOB',
  label: T.BackupJob,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 4 },
}

const NET = {
  name: 'NET',
  label: T.VirtualNetwork,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 4 },
}

const VNTEMPLATE = {
  name: 'VNTEMPLATE',
  label: T['acls.form.create.resources.vnettemplate'],
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 4 },
}

const VROUTER = {
  name: 'VROUTER',
  label: T.VirtualRouter,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 4 },
}

const SECURITY_GROUP = {
  name: 'SECGROUP',
  label: T.SecurityGroup,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 4 },
}

const CLUSTER = {
  name: 'CLUSTER',
  label: T.Cluster,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 4 },
}

const HOST = {
  name: 'HOST',
  label: T.Host,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 4 },
}

const USER = {
  name: 'USER',
  label: T.User,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 4 },
}

const GROUP = {
  name: 'GROUP',
  label: T.Group,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 4 },
}

const VDC = {
  name: 'VDC',
  label: T.VDC,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 4 },
}

const ZONE = {
  name: 'ZONE',
  label: T.Zone,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 4 },
}

const FIELDS = [
  VM,
  DOCUMENT,
  TEMPLATE,
  VMGROUP,
  DATASTORE,
  IMAGE,
  MARKETPLACE,
  MARKETPLACEAPP,
  BACKUPJOB,
  NET,
  VNTEMPLATE,
  VROUTER,
  SECURITY_GROUP,
  CLUSTER,
  HOST,
  USER,
  GROUP,
  VDC,
  ZONE,
]

const SCHEMA = getObjectSchemaFromFields(FIELDS)

export { SCHEMA, FIELDS }
