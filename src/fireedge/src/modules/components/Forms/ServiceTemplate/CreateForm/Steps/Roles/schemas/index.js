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
import { array, object, string } from 'yup'

import {
  ROLE_DEFINITION_FIELDS,
  TEMPLATE_ID_FIELD,
  ROLE_DEFINITION_SCHEMA,
} from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Roles/schemas/roleDefinition'

import {
  ADVANCED_PARAMS_SCHEMA,
  ADVANCED_PARAMS_FIELDS,
} from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Roles/schemas/advancedParameters'

import {
  ELASTICITY_POLICY_SCHEMA,
  SECTION_ID as EPOLICY_ID,
} from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Roles/dropdowns/sections/elasticity/schema'

import {
  SCHEDULED_POLICY_SCHEMA,
  SECTION_ID as SPOLICY_ID,
} from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Roles/dropdowns/sections/scheduled/schema'

import { MIN_MAX_SCHEMA } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Roles/dropdowns/sections/minMax'

const NIC_SCHEMA = object()
  .shape({
    NIC: array().of(
      object().shape({
        NETWORK_ID: string(),
        NAME: string(),
        FLOATING_IP: string(),
        FLOATING_ONLY: string(),
        NIC_ALIAS: object()
          .shape({
            NETWORK_ID: string(),
            NAME: string(),
          })
          .default(() => undefined),
      })
    ),
  })
  .default(() => undefined)

export const SCHEMA = array().of(
  object()
    .concat(ROLE_DEFINITION_SCHEMA)
    .concat(
      object().shape({
        template_contents: object().concat(NIC_SCHEMA),
      })
    )
    .concat(ADVANCED_PARAMS_SCHEMA)
    .concat(MIN_MAX_SCHEMA)
    .concat(
      object()
        .shape({
          [EPOLICY_ID]: array().of(ELASTICITY_POLICY_SCHEMA),
        })
        .concat(
          object().shape({
            [SPOLICY_ID]: array().of(SCHEDULED_POLICY_SCHEMA),
          })
        )
    )
)

export const FIELDS = [...ROLE_DEFINITION_FIELDS, ...ADVANCED_PARAMS_FIELDS]

export { TEMPLATE_ID_FIELD }
