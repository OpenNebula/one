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
import { object, ObjectSchema } from 'yup'

import { GRAPHICS_SCHEMA } from './graphicsSchema'
import { INPUTS_SCHEMA } from './inputsSchema'
import { VIDEO_SCHEMA } from './videoSchema'

/**
 * @param {string} [hypervisor] - VM hypervisor
 * @param {object} oneConfig - Config of oned.conf
 * @param {boolean} adminGroup - User is admin or not
 * @param {boolean} isUpdate - The form is being updated
 * @returns {ObjectSchema} I/O schema
 */
export const SCHEMA = (hypervisor, oneConfig, adminGroup, isUpdate) =>
  object()
    .concat(INPUTS_SCHEMA)
    .concat(GRAPHICS_SCHEMA(hypervisor, oneConfig, adminGroup, isUpdate))
    .concat(VIDEO_SCHEMA(hypervisor))

export * from './graphicsSchema'
export * from './inputsSchema'
export * from './videoSchema'
