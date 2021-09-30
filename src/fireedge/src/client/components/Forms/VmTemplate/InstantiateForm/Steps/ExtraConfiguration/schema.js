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
import { array, object, string } from 'yup'

import { INPUT_TYPES } from 'client/constants'
import { getValidationFromFields } from 'client/utils'

export const HOST_REQ_FIELD = {
  name: 'SCHED_REQUIREMENTS',
  label: 'Host requirements expression',
  tooltip: `
    Boolean expression that rules out provisioning hosts
    from list of machines suitable to run this VM`,
  type: INPUT_TYPES.TEXT,
  validation: string().trim().notRequired()
}

export const HOST_RANK_FIELD = {
  name: 'SCHED_RANK',
  label: 'Host policy expression',
  tooltip: `
    This field sets which attribute will be used
    to sort the suitable hosts for this VM`,
  type: INPUT_TYPES.TEXT,
  validation: string().trim().notRequired()
}

export const DS_REQ_FIELD = {
  name: 'DS_SCHED_REQUIREMENTS',
  label: 'Datastore requirements expression',
  tooltip: `
    Boolean expression that rules out entries from
    the pool of datastores suitable to run this VM.`,
  type: INPUT_TYPES.TEXT,
  validation: string().trim().notRequired()
}

export const DS_RANK_FIELD = {
  name: 'DS_SCHED_RANK',
  label: 'Datastore policy expression',
  tooltip: `
    This field sets which attribute will be used to
    sort the suitable datastores for this VM`,
  type: INPUT_TYPES.TEXT,
  validation: string().trim().notRequired()
}

export const SCHEMA = object({
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
    }))),
  OS: object({
    BOOT: string().trim().notRequired()
  }),
  ...getValidationFromFields([
    HOST_REQ_FIELD,
    HOST_RANK_FIELD,
    DS_REQ_FIELD,
    DS_RANK_FIELD
  ])
}).noUnknown(false)
