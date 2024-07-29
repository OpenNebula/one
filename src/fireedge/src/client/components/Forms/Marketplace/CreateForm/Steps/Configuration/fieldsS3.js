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

/** @type {Field} AWS field */
const AWS = {
  name: 'AWS',
  label: T['marketplace.form.configuration.s3.aws'],
  tooltip: T['marketplace.form.configuration.s3.aws.tooltip'],
  type: INPUT_TYPES.SWITCH,
  dependOf: '$general.MARKET_MAD',
  htmlType: (type) => type !== MARKET_TYPES.S3.value && INPUT_TYPES.HIDDEN,
  validation: boolean()
    .yesOrNo()
    .afterSubmit((value, { context }) => {
      if (context?.general?.MARKET_MAD === MARKET_TYPES.S3.value) {
        return value ? 'YES' : 'NO'
      } else {
        return undefined
      }
    })
    .default(() => true),
  grid: { xs: 12, md: 6 },
}

/** @type {Field} ACCESS_KEY_ID field */
const ACCESS_KEY_ID = {
  name: 'ACCESS_KEY_ID',
  label: T['marketplace.form.configuration.s3.accessKey'],
  tooltip: T['marketplace.form.configuration.s3.accessKey.tooltip'],
  type: INPUT_TYPES.TEXT,
  dependOf: '$general.MARKET_MAD',
  htmlType: (type) => type !== MARKET_TYPES.S3.value && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .when(
      '$general.MARKET_MAD',
      (type, schema) =>
        type &&
        (type !== MARKET_TYPES.S3.value ? schema.strip() : schema.required())
    )
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field} SECRET_ACCESS_KEY field */
const SECRET_ACCESS_KEY = {
  name: 'SECRET_ACCESS_KEY',
  label: T['marketplace.form.configuration.s3.secretAccessKey'],
  tooltip: T['marketplace.form.configuration.s3.secretAccessKey.tooltip'],
  type: INPUT_TYPES.TEXT,
  dependOf: '$general.MARKET_MAD',
  htmlType: (type) => type !== MARKET_TYPES.S3.value && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .when(
      '$general.MARKET_MAD',
      (type, schema) =>
        type &&
        (type !== MARKET_TYPES.S3.value ? schema.strip() : schema.required())
    )
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field} BUCKET field */
const BUCKET = {
  name: 'BUCKET',
  label: T['marketplace.form.configuration.s3.bucket'],
  tooltip: T['marketplace.form.configuration.s3.bucket.tooltip'],
  type: INPUT_TYPES.TEXT,
  dependOf: '$general.MARKET_MAD',
  htmlType: (type) => type !== MARKET_TYPES.S3.value && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .when(
      '$general.MARKET_MAD',
      (type, schema) =>
        type &&
        (type !== MARKET_TYPES.S3.value ? schema.strip() : schema.required())
    )
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field} REGION field */
const REGION = {
  name: 'REGION',
  label: T['marketplace.form.configuration.s3.region'],
  tooltip: T['marketplace.form.configuration.s3.region.tooltip'],
  type: INPUT_TYPES.TEXT,
  dependOf: '$general.MARKET_MAD',
  htmlType: (type) => type !== MARKET_TYPES.S3.value && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .when(
      '$general.MARKET_MAD',
      (type, schema) =>
        type &&
        (type !== MARKET_TYPES.S3.value ? schema.strip() : schema.required())
    )
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field} SIGNATURE_VERSION field */
const SIGNATURE_VERSION = {
  name: 'SIGNATURE_VERSION',
  type: INPUT_TYPES.TEXT,
  htmlType: INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .afterSubmit((value, { context }) =>
      context?.general?.MARKET_MAD === MARKET_TYPES.S3.value &&
      !context?.configuration?.AWS
        ? 's3'
        : undefined
    )
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field} FORCE_PATH_STYLE field */
const FORCE_PATH_STYLE = {
  name: 'FORCE_PATH_STYLE',
  type: INPUT_TYPES.TEXT,
  htmlType: INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .afterSubmit((value, { context }) =>
      context?.general?.MARKET_MAD === MARKET_TYPES.S3.value &&
      !context?.configuration?.AWS
        ? 'YES'
        : undefined
    )
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field} TOTAL_MB field */
const TOTAL_MB = {
  name: 'TOTAL_MB',
  label: T['marketplace.form.configuration.s3.totalMB'],
  tooltip: T['marketplace.form.configuration.s3.totalMB.tooltip'],
  type: INPUT_TYPES.TEXT,
  dependOf: '$general.MARKET_MAD',
  htmlType: (type) =>
    type !== MARKET_TYPES.S3.value ? INPUT_TYPES.HIDDEN : 'number',
  validation: number()
    .when(
      '$general.MARKET_MAD',
      (type, schema) =>
        type &&
        (type !== MARKET_TYPES.S3.value ? schema.strip() : schema.notRequired())
    )
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field} TOTAL_MB field */
const READ_LENGTH = {
  name: 'READ_LENGTH',
  label: T['marketplace.form.configuration.s3.readLength'],
  tooltip: T['marketplace.form.configuration.s3.readLength.tooltip'],
  type: INPUT_TYPES.TEXT,
  dependOf: '$general.MARKET_MAD',
  htmlType: (type) =>
    type !== MARKET_TYPES.S3.value ? INPUT_TYPES.HIDDEN : 'number',
  validation: number()
    .when(
      '$general.MARKET_MAD',
      (type, schema) =>
        type &&
        (type !== MARKET_TYPES.S3.value ? schema.strip() : schema.notRequired())
    )
    .default(() => undefined),
  grid: { md: 12 },
}

const FIELDS = [
  AWS,
  ACCESS_KEY_ID,
  SECRET_ACCESS_KEY,
  BUCKET,
  REGION,
  SIGNATURE_VERSION,
  FORCE_PATH_STYLE,
  TOTAL_MB,
  READ_LENGTH,
]

export { FIELDS }
