/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

import { mixed } from 'yup'

import { T } from '@ConstantsModule'
import { FIELDS as VROUTER_NIC_FIELDS } from '@modules/resources/VrTemplate/Forms/InstantiateForm/Steps/Networking/schema'
import { getObjectSchemaFromFields } from '@UtilsModule'

export const FIELDS = VROUTER_NIC_FIELDS.map((field) =>
  field.name === 'NETWORK_ID'
    ? {
        ...field,
        validation: mixed().required(T.SelectNetwork).default(null),
      }
    : field
)

export const SCHEMA = getObjectSchemaFromFields(FIELDS)
