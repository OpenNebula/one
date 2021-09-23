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
import { object } from 'yup'

import { FIELDS as INFORMATION_FIELDS, SCHEMA as INFORMATION_SCHEMA } from './informationSchema'
import { FIELDS as CAPACITY_FIELDS, SCHEMA as CAPACITY_SCHEMA } from './capacitySchema'
// import { FIELDS as DISK_FIELDS, SCHEMA as DISK_SCHEMA } from './diskSchema'
import { FIELDS as VM_GROUP_FIELDS, SCHEMA as VM_GROUP_SCHEMA } from './vmGroupSchema'
import { FIELDS as OWNERSHIP_FIELDS, SCHEMA as OWNERSHIP_SCHEMA } from './ownershipSchema'
import { FIELDS as VCENTER_FIELDS, SCHEMA as VCENTER_SCHEMA } from './vcenterSchema'

export const FIELDS = {
  INFORMATION: INFORMATION_FIELDS,
  CAPACITY: CAPACITY_FIELDS,
  // DISK: vmTemplate => DISK_FIELDS(vmTemplate),
  OWNERSHIP: OWNERSHIP_FIELDS,
  VM_GROUP: VM_GROUP_FIELDS,
  VCENTER: VCENTER_FIELDS
}

export const SCHEMA = object()
  .concat(INFORMATION_SCHEMA)
  .concat(CAPACITY_SCHEMA)
  // .concat(DISK_SCHEMA)
  .concat(OWNERSHIP_SCHEMA)
  .concat(VM_GROUP_SCHEMA)
  .concat(VCENTER_SCHEMA)
