/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { array, object } from 'yup'

import { NETWORK_INPUT_SCHEMA } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/networking/schema'

import { TAB_ID as NETWORK_ID } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/networking'

import { NETWORKS_EXTRA_SCHEMA } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/networking/extraDropdown/schema'

import { SECTION_ID as NETWORK_DROPDOWN_ID } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/networking/extraDropdown'

import { USER_INPUTS_SCHEMA } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/userInputs/schema'
import { TAB_ID as USER_INPUT_ID } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/userInputs'

import { TAB_ID as SCHED_ACTION_ID } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/scheduledActions'

import { VM_SCHED_SCHEMA as SCHED_ACTION_SCHEMA } from '@modules/components/Forms/Vm/CreateSchedActionForm/schema'

import { ADVANCED_PARAMS_SCHEMA } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/advancedParams/schema'
import { TAB_ID as ADVANCED_PARAMS_ID } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/advancedParams'

export const SCHEMA = object().concat(
  object().shape({
    [NETWORK_ID]: array().of(NETWORK_INPUT_SCHEMA(false)),
    [NETWORK_DROPDOWN_ID]: array().of(NETWORKS_EXTRA_SCHEMA),
    [USER_INPUT_ID]: array().of(USER_INPUTS_SCHEMA),
    [SCHED_ACTION_ID]: array().of(SCHED_ACTION_SCHEMA),
    [ADVANCED_PARAMS_ID]: ADVANCED_PARAMS_SCHEMA,
  })
)
