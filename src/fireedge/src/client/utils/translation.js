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

/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
import { setLocale, addMethod, number, string } from 'yup'

import { T } from 'client/constants'
import { isDivisibleBy, isBase64 } from 'client/utils/helpers'

const buildMethods = () => {
  addMethod(number, 'isDivisibleBy', function (divisor) {
    return this.test(
      'is-divisible',
      [T['validation.number.isDivisible'], divisor],
      value => isDivisibleBy(value, divisor)
    )
  })
  addMethod(string, 'isBase64', function () {
    return this.test(
      'is-base64',
      T['validation.string.invalidFormat'],
      value => isBase64(value)
    )
  })
}

/**
 * Function that runs the yup.setLocale().
 */
const buildTranslationLocale = () => {
  buildMethods()

  setLocale({
    mixed: {
      default: () => T['validation.mixed.default'],
      required: () => T['validation.mixed.required'],
      defined: () => T['validation.mixed.defined'],
      oneOf: ({ values }) => [T['validation.mixed.oneOf'], values],
      notOneOf: ({ values }) => [T['validation.mixed.notOneOf'], values],
      notType: ({ type }) =>
        T[`validation.mixed.notType.${type}`] ?? T['validation.mixed.notType']
    },
    string: {
      length: ({ length }) => [T['validation.string.length'], length],
      min: ({ min }) => [T['validation.string.min'], min],
      max: ({ max }) => [T['validation.string.max'], max],
      matches: ({ matches }) => [T['validation.string.matches'], matches],
      email: () => T['validation.string.email'],
      url: () => T['validation.string.url'],
      uuid: () => T['validation.string.uuid'],
      trim: () => T['validation.string.trim'],
      lowercase: () => T['validation.string.lowercase'],
      uppercase: () => T['validation.string.uppercase']
    },
    number: {
      min: ({ min }) => [T['validation.number.min'], min],
      max: ({ max }) => [T['validation.number.max'], max],
      lessThan: ({ less }) => [T['validation.number.lessThan'], less],
      moreThan: ({ more }) => [T['validation.number.moreThan'], more],
      positive: () => T['validation.number.positive'],
      negative: () => T['validation.number.negative'],
      integer: () => T['validation.number.integer']
    },
    boolean: {
      isValue: ({ value }) => [T['validation.boolean.isValue'], value]
    },
    date: {
      min: ({ min }) => [T['validation.date.min'], min],
      max: ({ max }) => [T['validation.date.max'], max]
    },
    object: {
      noUnknown: ({ nounknown }) => [T['validation.object.noUnknown'], nounknown]
    },
    array: {
      min: ({ min }) => [T['validation.array.min'], min],
      max: ({ max }) => [T['validation.array.max'], max],
      length: ({ length }) => [T['validation.array.length'], length]
    }
  })
}

export { buildTranslationLocale }
