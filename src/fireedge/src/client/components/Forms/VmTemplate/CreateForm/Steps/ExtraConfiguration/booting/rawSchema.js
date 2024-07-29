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
/* eslint-disable jsdoc/require-jsdoc */
import { string, boolean } from 'yup'

import { Field } from 'client/utils'
import { T, INPUT_TYPES, HYPERVISORS } from 'client/constants'

const { kvm, lxc } = HYPERVISORS

/** @type {Field} Raw type field */
const TYPE = {
  name: 'RAW.TYPE',
  label: T.Type,
  type: INPUT_TYPES.TEXT,
  notOnHypervisors: [lxc],
  htmlType: INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .notRequired()
    .equals([kvm])
    .default(() => kvm),
  fieldProps: { disabled: true },
  grid: { md: 12 },
}

/** @type {Field} Raw data field */
const DATA = {
  name: 'RAW.DATA',
  label: T.Data,
  type: INPUT_TYPES.TEXT,
  multiline: true,
  notOnHypervisors: [lxc],
  validation: string()
    .trim()
    .notRequired()
    .afterSubmit((value) => (value === '' ? undefined : value)),
  grid: { md: 12 },
}

/** @type {Field} Raw validate field */
const VALIDATE = {
  name: 'RAW.VALIDATE',
  label: T.Validate,
  tooltip: T.RawValidateConcept,
  type: INPUT_TYPES.CHECKBOX,
  notOnHypervisors: [lxc],
  dependOf: DATA.name,
  htmlType: (data) => !data && INPUT_TYPES.HIDDEN,
  validation: boolean().yesOrNo().default(false),
  grid: { md: 12 },
}

/** @type {Field[]} List of Boot fields */
export const RAW_FIELDS = [TYPE, DATA, VALIDATE]
