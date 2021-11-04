/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import { array, object } from 'yup'

import { FIELDS as PLACEMENT_FIELDS } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/placement/schema'
import { FIELDS as OS_FIELDS } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/booting/schema'
import { FIELDS as NUMA_FIELDS } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/numa/schema'
import { SCHEMA as IO_SCHEMA } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/inputOutput/schema'
import { SCHEMA as CONTEXT_SCHEMA } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/context/schema'
import { getObjectSchemaFromFields } from 'client/utils'

export const mapNameByIndex = (prefixName) => (resource, idx) => ({
  ...resource,
  NAME: resource?.NAME?.startsWith(prefixName) || !resource?.NAME
    ? `${prefixName}${idx}`
    : resource?.NAME
})

export const DISK_SCHEMA = array()
  .ensure()
  .transform(disks => disks.map(mapNameByIndex('DISK')))

export const NIC_SCHEMA = array()
  .ensure()
  .transform(nics => nics.map(mapNameByIndex('NIC')))

export const SCHED_ACTION_SCHEMA = array()
  .ensure()
  .transform(actions => actions.map(mapNameByIndex('SCHED_ACTION')))

export const SCHEMA = hypervisor => object({
  DISK: DISK_SCHEMA,
  NIC: NIC_SCHEMA,
  SCHED_ACTION: SCHED_ACTION_SCHEMA,
  USER_INPUTS: CONTEXT_SCHEMA
})
  .concat(IO_SCHEMA(hypervisor))
  .concat(getObjectSchemaFromFields([
    ...PLACEMENT_FIELDS,
    ...OS_FIELDS(hypervisor),
    ...NUMA_FIELDS(hypervisor)
  ]))
  .noUnknown(false)
