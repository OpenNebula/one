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
import { useMemo } from 'react'
import { string, number, boolean } from 'yup'

import { useAuth } from 'client/features/Auth'
import { getActionsAvailable } from 'client/models/Helper'
import { INPUT_TYPES, VM_ACTIONS } from 'client/constants'

const NAME = {
  name: 'name',
  label: 'VM name',
  tooltip: `
    Defaults to 'template name-<vmid>' when empty.
    When creating several VMs, the wildcard %%idx will be
    replaced with a number starting from 0`,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .default(() => undefined),
}

const INSTANCES = {
  name: 'instances',
  label: 'Number of instances',
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: number()
    .min(1, 'Instances minimum is 1')
    .integer('Instances should be an integer number')
    .required('Instances field is required')
    .default(() => 1),
}

const HOLD = {
  name: 'hold',
  label: 'Start VM on hold state',
  type: INPUT_TYPES.SWITCH,
  htmlType: () => {
    const { view, getResourceView } = useAuth()

    return useMemo(() => {
      const actions = getResourceView('VM')?.actions
      const actionsAvailable = getActionsAvailable(actions)

      return (
        !actionsAvailable?.includes?.(VM_ACTIONS.HOLD) && INPUT_TYPES.HIDDEN
      )
    }, [view])
  },
  tooltip: `
    Sets the new VM to hold state, instead of pending.
    The scheduler will not deploy VMs in this state.
    It can be released later, or deployed manually.`,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const PERSISTENT = {
  name: 'persistent',
  label: 'Instantiate as persistent',
  type: INPUT_TYPES.SWITCH,
  tooltip: `
    Creates a private persistent copy of the template
    plus any image defined in DISK, and instantiates that copy.`,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

export const FIELDS = [NAME, INSTANCES, HOLD, PERSISTENT]
