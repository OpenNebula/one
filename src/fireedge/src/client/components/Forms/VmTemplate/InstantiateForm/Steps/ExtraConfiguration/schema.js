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
import { array, object, string, lazy } from 'yup'
import { v4 as uuidv4 } from 'uuid'

import { SCHEMA as NETWORK_SCHEMA } from 'client/components/Forms/Vm/AttachNicForm/Steps/AdvancedOptions/schema'
import { SCHEMA as PUNCTUAL_SCHEMA } from 'client/components/Forms/Vm/CreateSchedActionForm/PunctualForm/schema'
import { SCHEMA as RELATIVE_SCHEMA } from 'client/components/Forms/Vm/CreateSchedActionForm/RelativeForm/schema'
import { INPUT_TYPES } from 'client/constants'
import { getValidationFromFields } from 'client/utils'

const ID_SCHEMA = string().uuid().required().default(uuidv4)

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

export const NIC_SCHEMA = object({
  NAME: string().trim(),
  NETWORK_ID: string().trim(),
  NETWORK: string().trim(),
  NETWORK_UNAME: string().trim(),
  SECURITY_GROUPS: string().trim()
}).concat(NETWORK_SCHEMA)

export const SCHED_ACTION_SCHEMA = lazy(({ TIME } = {}) => {
  const isRelative = String(TIME).includes('+')
  const schema = isRelative ? RELATIVE_SCHEMA : PUNCTUAL_SCHEMA

  return object({ ID: ID_SCHEMA }).concat(schema)
})

export const SCHEMA = object({
  NIC: array(NIC_SCHEMA),
  SCHED_ACTION: array(SCHED_ACTION_SCHEMA),
  OS: object({
    BOOT: string().trim().notRequired()
  }),
  ...getValidationFromFields([
    HOST_REQ_FIELD,
    HOST_RANK_FIELD,
    DS_REQ_FIELD,
    DS_RANK_FIELD
  ])
})
  .transform(({ SCHED_ACTION, NIC, ...rest }) => ({
    ...rest,
    SCHED_ACTION: [SCHED_ACTION ?? []].flat(),
    NIC: [NIC ?? []].flat()
  }))
