/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { PCI_DEVICES_SCHEMA } from './pciDevicesSchema'
import { VIDEO_SCHEMA } from './videoSchema'

/**
 * @param {string} [hypervisor] - VM hypervisor
 * @returns {ObjectSchema} I/O schema
 */
export const SCHEMA = (hypervisor) =>
  object()
    .concat(INPUTS_SCHEMA)
    .concat(PCI_DEVICES_SCHEMA)
    .concat(GRAPHICS_SCHEMA(hypervisor))
    .concat(VIDEO_SCHEMA(hypervisor))

export * from './graphicsSchema'
export * from './inputsSchema'
export * from './pciDevicesSchema'
export * from './videoSchema'
