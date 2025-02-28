/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { string, boolean } from 'yup'

import Image from '@modules/components/Image'
import { SystemAPI, LogoAPI } from '@FeaturesModule'
import { Field, arrayToOptions } from '@UtilsModule'
import {
  T,
  STATIC_FILES_URL,
  INPUT_TYPES,
  HYPERVISORS,
  DEFAULT_TEMPLATE_LOGO,
} from '@ConstantsModule'

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
export const HYPERVISOR_FIELD = (isUpdate) => ({
  name: 'HYPERVISOR',
  type: INPUT_TYPES.TOGGLE,
  values: arrayToOptions(Object.values(HYPERVISORS), {
    addEmpty: false,
    getText: (hypervisor) => hypervisor.toUpperCase(),
  }),
  validation: string()
    .trim()
    .required()
    .default(() => (isUpdate ? undefined : HYPERVISORS.kvm)),

  grid: { md: 12 },
})

/** @type {Field} Logo field */
export const LOGO = {
  name: 'LOGO',
  label: T.Logo,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: () => {
    const { data: logos } = LogoAPI.useGetTemplateLogosQuery()

    return arrayToOptions([...Object.entries(logos || {})], {
      addEmpty: true,
      getText: ([name]) => name,
      getValue: ([, logo]) => logo,
    })
  },
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
    .default(() => DEFAULT_TEMPLATE_LOGO),
  grid: { md: 12 },
}

/** @type {Field} Virtual Router field */
export const VROUTER_FIELD = {
  name: 'VROUTER',
  label: T.MakeTemplateAvailableForVROnly,
  type: INPUT_TYPES.SWITCH,
  validation: boolean().yesOrNo(),
  grid: { md: 6 },
}

/* eslint-disable jsdoc/require-jsdoc */
export const OS_PROFILE = (isUpdate, lastOsProfile) => ({
  name: 'OS_PROFILE',
  label: T.Profile,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: () => {
    const { data: profiles = [] } = SystemAPI.useGetOsProfilesQuery()

    return arrayToOptions(profiles, {
      addEmpty: true,
      getText: (val) => {
        try {
          const parts = val
            ?.split('_')
            ?.map((part) => part?.charAt(0).toUpperCase() + part?.slice(1))

          return `${val === lastOsProfile ? '*' : ''}  ${parts?.join(' ')}`
        } catch (error) {
          return val
        }
      },
      getValue: (val) => val,
    })
  },
  validation: string()
    .trim()
    .notRequired()
    .default(() => '-'),
  grid: { md: 6 },
})

/**
 * @param {boolean} isUpdate - If `true`, the form is being updated
 * @returns {Field[]} List of information fields
 */
export const FIELDS = (isUpdate) => [NAME(isUpdate), DESCRIPTION, LOGO]
