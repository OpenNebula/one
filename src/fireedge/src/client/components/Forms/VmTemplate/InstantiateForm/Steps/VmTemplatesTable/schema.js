/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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

const TEMPLATE_SCHEMA = object({
  ID: string(),
  NAME: string(),
  TEMPLATE: object({
    DISK: array().ensure(),
    NIC: array().ensure(),
    SCHED_ACTION: array().ensure(),
    HYPERVISOR: string(),
  }),
})

export const SCHEMA = array(TEMPLATE_SCHEMA)
  .min(1, 'Select VM Template')
  .max(1, 'Max. one template selected')
  .required('Template field is required')
  .default(undefined)
