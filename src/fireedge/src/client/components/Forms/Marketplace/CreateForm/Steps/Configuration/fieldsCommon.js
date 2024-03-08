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
import { INPUT_TYPES, T, MARKET_TYPES } from 'client/constants'
import { string } from 'yup'
import { Field } from 'client/utils'

/** @type {Field} BASE_URL field */
const BASE_URL = {
  name: 'BASE_URL',
  label: (type) => {
    if (type === MARKET_TYPES.HTTP.value)
      return T['marketplace.form.configuration.http.url']
    else if (type === MARKET_TYPES.DOCKER_REGISTRY.value)
      return T['marketplace.form.configuration.dockerRegistry.url']
  },
  type: INPUT_TYPES.TEXT,
  dependOf: '$general.MARKET_MAD',
  htmlType: (type) =>
    type !== MARKET_TYPES.HTTP.value &&
    type !== MARKET_TYPES.DOCKER_REGISTRY.value &&
    INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .when('$general.MARKET_MAD', (type, schema) => {
      if (type)
        return type !== MARKET_TYPES.HTTP.value &&
          type !== MARKET_TYPES.DOCKER_REGISTRY.value
          ? schema.strip()
          : schema.required()
    })
    .default(() => undefined),
  grid: { md: 12 },
  fieldProps: { placeholder: 'http://frontend.opennebula.org/' },
}

/** @type {Field} ENDPOINT field */
const ENDPOINT = {
  name: 'ENDPOINT',
  label: (type) => {
    if (type === MARKET_TYPES.S3.value)
      return T['marketplace.form.configuration.s3.endpoint']
    else if (type === MARKET_TYPES.OPENNEBULA.value)
      return T['marketplace.form.configuration.one.url']
  },
  tooltip: (type) => {
    if (type === MARKET_TYPES.S3.value)
      return T['marketplace.form.configuration.s3.endpoint.tooltip']
  },
  type: INPUT_TYPES.TEXT,
  dependOf: '$general.MARKET_MAD',
  htmlType: (type) =>
    type !== MARKET_TYPES.S3.value &&
    type !== MARKET_TYPES.OPENNEBULA.value &&
    INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .when(
      ['$general.MARKET_MAD', '$configuration.AWS'],
      (type, aws, schema) => {
        if (type) {
          if (
            type === MARKET_TYPES.OPENNEBULA.value ||
            (type === MARKET_TYPES.S3.value && !aws)
          )
            return schema.required()
          else if (type === MARKET_TYPES.S3.value && aws)
            return schema.notRequired()
          else return schema.strip()
        }
      }
    )
    .default(() => undefined),
  grid: { md: 12 },
}

const FIELDS = [BASE_URL, ENDPOINT]

export { FIELDS }
