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
import { INPUT_TYPES, T, MARKET_TYPES } from 'client/constants'
import { string, boolean, number } from 'yup'
import { Field } from 'client/utils'

/** @type {Field} IMAGE_SIZE_MB field */
const IMAGE_SIZE_MB = (update) => ({
  name: 'IMAGE_SIZE_MB',
  label: T['marketplace.form.configuration.linuxcontainers.imageSize'],
  type: INPUT_TYPES.TEXT,
  dependOf: '$general.MARKET_MAD',
  htmlType: (type) =>
    type !== MARKET_TYPES.LINUX_CONTAINERS.value
      ? INPUT_TYPES.HIDDEN
      : 'number',
  validation: number(),
  grid: { md: 12 },
  defaultValue: !update ? 1024 : undefined,
})

/** @type {Field} FILESYSTEM field */
const FILESYSTEM = (update) => ({
  name: 'FILESYSTEM',
  label: T['marketplace.form.configuration.linuxcontainers.filesystem'],
  type: INPUT_TYPES.TEXT,
  dependOf: '$general.MARKET_MAD',
  htmlType: (type) =>
    type !== MARKET_TYPES.LINUX_CONTAINERS.value && INPUT_TYPES.HIDDEN,
  validation: string(),
  grid: { md: 12 },
  defaultValue: !update ? 'ext4' : undefined,
})

/** @type {Field} FORMAT field */
const FORMAT = (update) => ({
  name: 'FORMAT',
  label: T['marketplace.form.configuration.linuxcontainers.format'],
  type: INPUT_TYPES.TEXT,
  dependOf: '$general.MARKET_MAD',
  htmlType: (type) =>
    type !== MARKET_TYPES.LINUX_CONTAINERS.value && INPUT_TYPES.HIDDEN,
  validation: string(),
  grid: { md: 12 },
  defaultValue: !update ? 'raw' : undefined,
})

/** @type {Field} CPU field */
const CPU = (update) => ({
  name: 'CPU',
  label: T['marketplace.form.configuration.linuxcontainers.cpu'],
  type: INPUT_TYPES.TEXT,
  dependOf: '$general.MARKET_MAD',
  htmlType: (type) =>
    type !== MARKET_TYPES.LINUX_CONTAINERS.value
      ? INPUT_TYPES.HIDDEN
      : 'number',
  validation: number(),
  grid: { md: 12 },
  defaultValue: !update ? 1 : undefined,
})

/** @type {Field} VCPU field */
const VCPU = (update) => ({
  name: 'VCPU',
  label: T['marketplace.form.configuration.linuxcontainers.vcpu'],
  type: INPUT_TYPES.TEXT,
  dependOf: '$general.MARKET_MAD',
  htmlType: (type) =>
    type !== MARKET_TYPES.LINUX_CONTAINERS.value
      ? INPUT_TYPES.HIDDEN
      : 'number',
  validation: number(),
  grid: { md: 12 },
  defaultValue: !update ? 2 : undefined,
})

/** @type {Field} MEMORY field */
const MEMORY = (update) => ({
  name: 'MEMORY',
  label: T['marketplace.form.configuration.linuxcontainers.memory'],
  type: INPUT_TYPES.TEXT,
  dependOf: '$general.MARKET_MAD',
  htmlType: (type) =>
    type !== MARKET_TYPES.LINUX_CONTAINERS.value
      ? INPUT_TYPES.HIDDEN
      : 'number',
  validation: number().notRequired(),
  grid: { md: 12 },
  defaultValue: !update ? 768 : undefined,
})

/** @type {Field} SKIP_UNTESTED field */
const SKIP_UNTESTED = {
  name: 'SKIP_UNTESTED',
  label: T['marketplace.form.configuration.linuxcontainers.skip_untested'],
  type: INPUT_TYPES.SWITCH,
  dependOf: '$general.MARKET_MAD',
  htmlType: (type) =>
    type !== MARKET_TYPES.LINUX_CONTAINERS.value && INPUT_TYPES.HIDDEN,
  validation: boolean()
    .yesOrNo()
    .afterSubmit((value, { context }) => {
      if (
        context?.general?.MARKET_MAD === MARKET_TYPES.LINUX_CONTAINERS.value
      ) {
        return value ? 'YES' : 'NO'
      } else {
        return undefined
      }
    })
    .default(() => true),
  grid: { md: 6 },
}

/** @type {Field} PRIVILEGED field */
const PRIVILEGED = {
  name: 'PRIVILEGED',
  label: T['marketplace.form.configuration.linuxcontainers.privileged'],
  type: INPUT_TYPES.SWITCH,
  dependOf: '$general.MARKET_MAD',
  htmlType: (type) =>
    type !== MARKET_TYPES.LINUX_CONTAINERS.value && INPUT_TYPES.HIDDEN,
  validation: boolean()
    .yesOrNo()
    .afterSubmit((value, { context }) => {
      if (
        context?.general?.MARKET_MAD === MARKET_TYPES.LINUX_CONTAINERS.value
      ) {
        return value ? 'YES' : 'NO'
      } else {
        return undefined
      }
    })
    .default(() => true),
  grid: { md: 6 },
}

/**
 * Generate all the fields of the Linux Container Marketplace form.
 *
 * @param {boolean} update - If the user is updating or creating the form
 * @returns {Array} - Fields array
 */
const FIELDS = (update) => [
  IMAGE_SIZE_MB(update),
  FILESYSTEM(update),
  FORMAT(update),
  CPU(update),
  VCPU(update),
  MEMORY(update),
  SKIP_UNTESTED,
  PRIVILEGED,
]

export { FIELDS }
