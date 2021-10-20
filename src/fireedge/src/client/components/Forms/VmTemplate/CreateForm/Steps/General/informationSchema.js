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
import { T, LOGO_IMAGES_URL, INPUT_TYPES, HYPERVISORS } from 'client/constants'
import { Field, arrayToOptions } from 'client/utils'

/** @type {Field} Name field */
export const NAME = {
  name: 'NAME',
  label: T.Name,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
  grid: { sm: 6 }
}

/** @type {Field} Description field */
export const DESCRIPTION = {
  name: 'DESCRIPTION',
  label: T.Description,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined)
}

/** @type {Field} Hypervisor field */
export const HYPERVISOR_FIELD = {
  name: 'HYPERVISOR',
  type: INPUT_TYPES.TOGGLE,
  values: arrayToOptions(Object.values(HYPERVISORS), {
    addEmpty: false,
    getText: hypervisor => hypervisor.toUpperCase()
  }),
  validation: string()
    .trim()
    .required()
    .default(() => HYPERVISORS.kvm),
  grid: { md: 12 }
}

/** @type {Field} Logo field */
export const LOGO = {
  name: 'LOGO',
  label: T.Logo,
  type: INPUT_TYPES.SELECT,
  values: [
    { text: '-', value: '' },
    // client/assets/images/logos
    { text: 'Alpine Linux', value: 'alpine.png' },
    { text: 'ALT', value: 'alt.png' },
    { text: 'Arch', value: 'arch.png' },
    { text: 'CentOS', value: 'centos.png' },
    { text: 'Debian', value: 'debian.png' },
    { text: 'Devuan', value: 'devuan.png' },
    { text: 'Fedora', value: 'fedora.png' },
    { text: 'FreeBSD', value: 'freebsd.png' },
    { text: 'HardenedBSD', value: 'hardenedbsd.png' },
    { text: 'Knoppix', value: 'knoppix.png' },
    { text: 'Linux', value: 'linux.png' },
    { text: 'Oracle', value: 'oracle.png' },
    { text: 'RedHat', value: 'redhat.png' },
    { text: 'Suse', value: 'suse.png' },
    { text: 'Ubuntu', value: 'ubuntu.png' },
    { text: 'Windows xp', value: 'windowsxp.png' },
    { text: 'Windows 10', value: 'windows8.png' }
  ],
  // eslint-disable-next-line react/display-name
  renderValue: value => (
    <Image
      imgProps={{
        height: 25,
        width: 25,
        style: { marginRight: 10 }
      }}
      src={`${LOGO_IMAGES_URL}/${value}`}
    />
  ),
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined)
}

/** @type {Field[]} List of information fields */
export const FIELDS = [
  NAME,
  DESCRIPTION,
  LOGO
]
