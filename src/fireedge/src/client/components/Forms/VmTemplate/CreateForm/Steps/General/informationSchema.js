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

import Image from 'client/components/Image'
import { T, STATIC_FILES_URL, INPUT_TYPES, HYPERVISORS } from 'client/constants'
import { Field, arrayToOptions } from 'client/utils'

/**
 * @param {boolean} isUpdate - If `true`, the form is being updated
 * @returns {Field} Name field
 */
export const NAME = (isUpdate) => ({
  name: 'NAME',
  label: T.Name,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
  grid: { md: 12 },
  ...(isUpdate && { fieldProps: { disabled: true } }),
})

/** @type {Field} Description field */
export const DESCRIPTION = {
  name: 'DESCRIPTION',
  label: T.Description,
  type: INPUT_TYPES.TEXT,
  multiline: true,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field} Hypervisor field */
export const HYPERVISOR_FIELD = {
  name: 'HYPERVISOR',
  type: INPUT_TYPES.TOGGLE,
  values: arrayToOptions(Object.values(HYPERVISORS), {
    addEmpty: false,
    getText: (hypervisor) => hypervisor.toUpperCase(),
  }),
  validation: string()
    .trim()
    .required()
    .default(() => HYPERVISORS.kvm),
  grid: { md: 12 },
}

/** @type {Field} Logo field */
export const LOGO = {
  name: 'LOGO',
  label: T.Logo,
  type: INPUT_TYPES.SELECT,
  values: [
    { text: '-', value: '' },
    { text: 'Alpine Linux', value: 'images/logos/alpine.png' },
    { text: 'ALT', value: 'images/logos/alt.png' },
    { text: 'Arch', value: 'images/logos/arch.png' },
    { text: 'CentOS', value: 'images/logos/centos.png' },
    { text: 'Debian', value: 'images/logos/debian.png' },
    { text: 'Devuan', value: 'images/logos/devuan.png' },
    { text: 'Fedora', value: 'images/logos/fedora.png' },
    { text: 'FreeBSD', value: 'images/logos/freebsd.png' },
    { text: 'HardenedBSD', value: 'images/logos/hardenedbsd.png' },
    { text: 'Knoppix', value: 'images/logos/knoppix.png' },
    { text: 'Linux', value: 'images/logos/linux.png' },
    { text: 'Oracle', value: 'images/logos/oracle.png' },
    { text: 'RedHat', value: 'images/logos/redhat.png' },
    { text: 'Suse', value: 'images/logos/suse.png' },
    { text: 'Ubuntu', value: 'images/logos/ubuntu.png' },
    { text: 'Windows xp', value: 'images/logos/windowsxp.png' },
    { text: 'Windows 10', value: 'images/logos/windows8.png' },
  ],
  renderValue: (value) => (
    <Image
      alt="logo"
      imgProps={{ height: 25, width: 25, style: { marginRight: 10 } }}
      // expected url for Ruby Sunstone compatibility
      // => images/logos/{logo}.png
      src={`${STATIC_FILES_URL}/${value}`}
    />
  ),
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  grid: { md: 12 },
}

/**
 * @param {boolean} isUpdate - If `true`, the form is being updated
 * @returns {Field[]} List of information fields
 */
export const FIELDS = (isUpdate) => [NAME(isUpdate), DESCRIPTION, LOGO]
