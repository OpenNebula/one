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
import { UserInputObject } from '@ConstantsModule'
import { object, array } from 'yup'

import { NETWORK_INPUT_SCHEMA } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/networking/schema'

import { TAB_ID as NETWORK_ID } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/networking'

import { NETWORKS_EXTRA_SCHEMA } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/networking/extraDropdown/schema'

import { SECTION_ID as NETWORK_DROPDOWN_ID } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/networking/extraDropdown'

/**
 * @param {UserInputObject[]} userInputs - User inputs
 * @returns {object} User inputs schema
 */
export const SCHEMA = object().concat(
  object().shape({
    [NETWORK_ID]: array().of(NETWORK_INPUT_SCHEMA),
    [NETWORK_DROPDOWN_ID]: array().of(NETWORKS_EXTRA_SCHEMA),
  })
)
