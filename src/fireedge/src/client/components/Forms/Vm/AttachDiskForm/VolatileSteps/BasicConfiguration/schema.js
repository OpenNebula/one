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
/* eslint-disable jsdoc/require-jsdoc */
import * as yup from 'yup'

import { INPUT_TYPES, HYPERVISORS } from 'client/constants'
import { getValidationFromFields } from 'client/utils'

const { vcenter } = HYPERVISORS

const SIZE = {
  name: 'SIZE',
  label: 'Size',
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: yup
    .number()
    .typeError('Size value must be a number')
    .required('Size field is required')
    .default(undefined)
}

const TYPE = hypervisor => ({
  name: 'TYPE',
  label: 'Disk type',
  type: INPUT_TYPES.SELECT,
  values: hypervisor === vcenter
    ? [{ text: 'FS', value: 'fs' }]
    : [
      { text: 'FS', value: 'fs' },
      { text: 'Swap', value: 'swap' }
    ],
  validation: yup
    .string()
    .trim()
    .notRequired()
    .default('fs')
})

const FORMAT = hypervisor => {
  const typeFieldName = TYPE(hypervisor).name

  return {
    name: 'FORMAT',
    label: 'Format',
    type: INPUT_TYPES.SELECT,
    dependOf: typeFieldName,
    htmlType: type => type === 'swap' ? INPUT_TYPES.HIDDEN : undefined,
    values: hypervisor === vcenter
      ? [{ text: 'Raw', value: 'raw' }]
      : [
        { text: 'Raw', value: 'raw' },
        { text: 'qcow2', value: 'qcow2' }
      ],
    validation: yup
      .string()
      .trim()
      .when(typeFieldName, (type, schema) => type === 'swap'
        ? schema.notRequired()
        : schema.required('Format field is required')
      )
      .default('raw')
  }
}

const FILESYSTEM = hypervisor => ({
  name: 'FS',
  label: 'Filesystem',
  notOnHypervisors: [vcenter],
  type: INPUT_TYPES.SELECT,
  dependOf: TYPE(hypervisor).name,
  htmlType: type => type === 'swap' ? INPUT_TYPES.HIDDEN : undefined,
  values: [ // TODO: sunstone-config => support_fs ???
    { text: '', value: '' },
    { text: 'ext4', value: 'ext4' },
    { text: 'ext3', value: 'ext3' },
    { text: 'ext2', value: 'ext2' },
    { text: 'xfs', value: 'xfs' }
  ],
  validation: yup
    .string()
    .trim()
    .notRequired()
    .default(undefined)
})

export const FIELDS = hypervisor => [
  SIZE,
  TYPE,
  FORMAT,
  FILESYSTEM
]
  .map(field => typeof field === 'function' ? field(hypervisor) : field)
  .filter(({ notOnHypervisors } = {}) => !notOnHypervisors?.includes?.(hypervisor))

export const SCHEMA = hypervisor =>
  yup.object(getValidationFromFields(FIELDS(hypervisor)))
