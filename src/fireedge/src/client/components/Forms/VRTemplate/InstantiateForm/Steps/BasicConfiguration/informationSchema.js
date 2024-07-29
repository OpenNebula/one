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
import { useMemo } from 'react'
import { string, number, boolean } from 'yup'

import { useViews } from 'client/features/Auth'
import { getActionsAvailable } from 'client/models/Helper'
import { T, RESOURCE_NAMES, INPUT_TYPES, VM_ACTIONS } from 'client/constants'
import { getObjectSchemaFromFields } from 'client/utils'

const NAME = {
  name: 'name',
  label: T.Name,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .required()
    .trim()
    .default(() => undefined),
  grid: { md: 6 },
}

const DESCRIPTION = {
  name: 'description',
  label: 'Description',
  type: INPUT_TYPES.TEXT,
  multiline: true,
  validation: string().trim().default(''),
  grid: { md: 6 },
}

const KEEPALIVEID = {
  name: 'keepaliveid',
  label: T.KeepAliveID,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .default(() => undefined),
  grid: { md: 6 },
}

const KEEPALIVEPASS = {
  name: 'keepalivepass',
  label: T.KeepAlivePass,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .default(() => undefined),
  grid: { md: 6 },
}

const VMNAME = {
  name: 'vmname',
  label: T.VmName,
  tooltip: T.VmTemplateNameHelper,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .default(() => undefined),
  grid: { md: 6 },
}

const INSTANCES = {
  name: 'instances',
  label: T.NumberOfInstances,
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: number()
    .min(1)
    .integer()
    .required()
    .default(() => 1),
  grid: { md: 6 },
}

const HOLD = {
  name: 'hold',
  label: T.VmOnHoldState,
  type: INPUT_TYPES.SWITCH,
  htmlType: () => {
    const { view, getResourceView } = useViews()

    return useMemo(() => {
      const resource = RESOURCE_NAMES.VM
      const actions = getResourceView(resource)?.actions
      const actionsAvailable = getActionsAvailable(actions)

      return (
        !actionsAvailable?.includes?.(VM_ACTIONS.HOLD) && INPUT_TYPES.HIDDEN
      )
    }, [view])
  },
  tooltip: T.VmOnHoldStateConcept,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const PERSISTENT = {
  name: 'persistent',
  label: T.InstantiateAsPersistent,
  type: INPUT_TYPES.SWITCH,
  tooltip: T.InstantiateAsPersistentConcept,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

export const FIELDS = [
  NAME,
  DESCRIPTION,
  KEEPALIVEID,
  KEEPALIVEPASS,
  VMNAME,
  INSTANCES,
  HOLD,
  PERSISTENT,
]

export const SCHEMA = getObjectSchemaFromFields(FIELDS)
