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
import { INPUT_TYPES, T } from 'client/constants'
import { Field, getObjectSchemaFromFields } from 'client/utils'
import { boolean } from 'yup'

/** @type {Field} Make new images persistent by default field */
const DEFAULT_IMAGE_PERSISTENT_NEW = {
  name: 'OPENNEBULA.DEFAULT_IMAGE_PERSISTENT_NEW',
  label: T['groups.system.defaultImagePersistentNew.title'],
  tooltip: T['groups.system.defaultImagePersistentNew.tooltip'],
  type: INPUT_TYPES.SWITCH,
  validation: boolean()
    .yesOrNo()
    .default(() => false),
  grid: { md: 12 },
}

/** @type {Field} Make save-as and clone images persistent by default field */
const DEFAULT_IMAGE_PERSISTENT = {
  name: 'OPENNEBULA.DEFAULT_IMAGE_PERSISTENT',
  label: T['groups.system.defaultImagePersistent.title'],
  tooltip: T['groups.system.defaultImagePersistent.tooltip'],
  type: INPUT_TYPES.SWITCH,
  validation: boolean()
    .yesOrNo()
    .default(() => false),
  grid: { md: 12 },
}

const SYSTEM_FIELDS = [DEFAULT_IMAGE_PERSISTENT_NEW, DEFAULT_IMAGE_PERSISTENT]
const SCHEMA = getObjectSchemaFromFields(SYSTEM_FIELDS)

export { SCHEMA, SYSTEM_FIELDS }
