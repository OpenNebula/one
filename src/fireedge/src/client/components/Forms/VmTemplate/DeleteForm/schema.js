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
import { object, boolean } from 'yup'
import { T, INPUT_TYPES } from 'client/constants'
import { getValidationFromFields } from 'client/utils'

const DELETE_IMAGE = {
  name: 'image',
  label: T.DeleteAllImages,
  type: INPUT_TYPES.SWITCH,
  tooltip: T.DeleteAllImagesConcept,
  validation: boolean()
    .notRequired()
    .default(() => false),
}

export const FIELDS = [DELETE_IMAGE]

export const SCHEMA = object(getValidationFromFields(FIELDS))
