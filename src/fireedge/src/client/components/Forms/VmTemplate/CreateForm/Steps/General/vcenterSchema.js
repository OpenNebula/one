/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { string } from 'yup'

import { T, INPUT_TYPES, HYPERVISORS } from 'client/constants'
import { Field } from 'client/utils'

const { vcenter, ...hypervisors } = HYPERVISORS

/** @type {Field} Common field attributes */
const commonAttributes = {
  notOnHypervisors: Object.values(hypervisors),
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field} vCenter template reference field */
const VCENTER_TEMPLATE_FIELD = {
  ...commonAttributes,
  name: 'VCENTER_TEMPLATE_REF',
  label: T.vCenterTemplateRef,
}

/** @type {Field} vCenter cluster reference field */
const VCENTER_CCR_FIELD = {
  ...commonAttributes,
  name: 'VCENTER_CCR_REF',
  label: T.vCenterClusterRef,
}

/** @type {Field} vCenter instance id field */
const VCENTER_INSTANCE_ID = {
  ...commonAttributes,
  name: 'VCENTER_INSTANCE_ID',
  label: T.vCenterInstanceId,
}

/** @type {Field} vCenter VM folder field */
const VCENTER_FOLDER_FIELD = {
  ...commonAttributes,
  name: 'VCENTER_VM_FOLDER',
  label: T.vCenterVmFolder,
  tooltip: T.vCenterVmFolderConcept,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
}

/** @type {Field[]} List of vCenter fields */
export const FIELDS = [
  VCENTER_TEMPLATE_FIELD,
  VCENTER_CCR_FIELD,
  VCENTER_INSTANCE_ID,
  VCENTER_FOLDER_FIELD,
]
