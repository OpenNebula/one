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
import { array, object } from 'yup'

import { NETWORK_INPUT_SCHEMA } from './networking/schema'
import { CUSTOM_ATTRIBUTES_SCHEMA } from './customAttributes/schema'
import { SCHED_ACTION_SCHEMA } from './scheduledActions'
import { ADVANCED_PARAMS_SCHEMA } from './advancedParams/schema'

export const SCHEMA = object()
  .shape({
    NETWORKING: array().of(NETWORK_INPUT_SCHEMA),
  })
  .shape({
    CUSTOM_ATTRIBUTES: array().of(CUSTOM_ATTRIBUTES_SCHEMA),
  })
  .concat(ADVANCED_PARAMS_SCHEMA)
  .concat(SCHED_ACTION_SCHEMA)
