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

import { PLACEMENT_FIELDS } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/placement/schema'
import { OS_FIELDS } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/booting/schema'
import { NUMA_FIELDS } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/numa/schema'
import { getObjectSchemaFromFields } from 'client/utils'

export const SCHEMA = hypervisor => object({
  DISK: array()
    .ensure()
    .transform(disks => disks?.map((disk, idx) => ({
      ...disk,
      NAME: disk?.NAME?.startsWith('DISK') || !disk?.NAME
        ? `DISK${idx}`
        : disk?.NAME
    }))),
  NIC: array()
    .ensure()
    .transform(nics => nics?.map((nic, idx) => ({
      ...nic,
      NAME: nic?.NAME?.startsWith('NIC') || !nic?.NAME
        ? `NIC${idx}`
        : nic?.NAME
    }))),
  SCHED_ACTION: array()
    .ensure()
    .transform(actions => actions?.map((action, idx) => ({
      ...action,
      NAME: action?.NAME?.startsWith('SCHED_ACTION') || !action?.NAME
        ? `SCHED_ACTION${idx}`
        : action?.NAME
    })))
})
  .concat(getObjectSchemaFromFields([
    ...PLACEMENT_FIELDS,
    ...OS_FIELDS(hypervisor),
    ...NUMA_FIELDS(hypervisor)
  ]))
  .noUnknown(false)
