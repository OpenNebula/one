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

import * as ioSchema from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/inputOutput/schema'

import { VIDEO_SCHEMA } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/inputOutput/videoSchema'

import {
  Field,
  filterFieldsByHypervisor,
  getObjectSchemaFromFields,
} from 'client/utils'
import { HYPERVISORS, ATTR_CONF_CAN_BE_UPDATED } from 'client/constants'

const getFields = (section) =>
  section.map((attr) => ioSchema[attr]).filter(Boolean)

/**
 * @param {object} [formProps] - Form props
 * @param {HYPERVISORS} [formProps.hypervisor] - VM hypervisor
 * @returns {Field[]} List of Graphics editable fields
 */
export const GRAPHICS_FIELDS = ({ hypervisor }) =>
  filterFieldsByHypervisor(
    getFields(ATTR_CONF_CAN_BE_UPDATED.GRAPHICS),
    hypervisor
  )

/**
 * @param {object} [formProps] - Form props
 * @param {HYPERVISORS} [formProps.hypervisor] - VM hypervisor
 * @returns {ObjectSchema} Graphics schema
 */
export const GRAPHICS_SCHEMA = ({ hypervisor }) =>
  getObjectSchemaFromFields(GRAPHICS_FIELDS({ hypervisor }))

/**
 * @param {object} [formProps] - Form props
 * @param {HYPERVISORS} [formProps.hypervisor] - VM hypervisor
 * @returns {ObjectSchema} I/O schema
 */
export const SCHEMA = ({ hypervisor }) =>
  object()
    .concat(ioSchema.INPUTS_SCHEMA)
    .concat(GRAPHICS_SCHEMA({ hypervisor }))
    .concat(VIDEO_SCHEMA(hypervisor))
