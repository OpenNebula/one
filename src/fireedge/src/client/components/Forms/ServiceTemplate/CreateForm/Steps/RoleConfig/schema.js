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
import { array, object, mixed } from 'yup'

import { ADVANCED_PARAMS_SCHEMA } from './AdvancedParameters/schema'
import { createElasticityPoliciesSchema } from './ElasticityPolicies/schema'
import { createScheduledPoliciesSchema } from './ScheduledPolicies/schema'
import { createMinMaxVmsSchema } from './MinMaxVms/schema'

export const SCHEMA = object()
  .shape({
    MINMAXVMS: array().of(createMinMaxVmsSchema()),
  })
  .shape({
    ELASTICITYPOLICIES: array().of(
      array().of(createElasticityPoliciesSchema())
    ),
  })
  .shape({
    SCHEDULEDPOLICIES: array().of(array().of(createScheduledPoliciesSchema())),
  })
  .shape({
    NETWORKS: array(),
    NETWORKDEFS: array(),
    // Set to mixed, casting wont work for dynamically calculated keys
    // In reality should be [number()]: string()
    RDP: mixed(),
  })
  .concat(ADVANCED_PARAMS_SCHEMA)
