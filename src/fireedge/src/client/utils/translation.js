/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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

import {
  setLocale,
  addMethod,
  number,
  string,
  boolean,
  object,
  array,
  date,
} from 'yup'

import { T } from 'client/constants'
import { isDivisibleBy, isBase64 } from 'client/utils/number'

const buildMethods = () => {
  ;[number, string, boolean, object, array, date].forEach((schemaType) => {
    addMethod(schemaType, 'afterSubmit', function (fn) {
      this._mutate = true // allows to mutate the initial schema
      this.submit = (...args) =>
        typeof fn === 'function' ? fn(...args) : args[0]

      return this
    })
    addMethod(schemaType, 'cast', function (value, options = {}) {
      const resolvedSchema = this.resolve({ value, ...options })
      let result = resolvedSchema._cast(value, options)

      if (options.isSubmit) {
        result = this.submit?.(result, options) ?? result
      }

      return result
    })
  })
  addMethod(boolean, 'yesOrNo', function (addAfterSubmit = true) {
    const schema = this.transform(function (value) {
      return !this.isType(value) ? String(value).toUpperCase() === 'YES' : value
    })

    if (addAfterSubmit) {
      schema.afterSubmit((value) => (value ? 'YES' : 'NO'))
    }

    return schema
  })
  addMethod(number, 'isDivisibleBy', function (divisor) {
    return this.test(
      'is-divisible',
      [T['validation.number.isDivisible'], divisor],
      (value) => isDivisibleBy(value, divisor)
    )
  })
  addMethod(string, 'isBase64', function () {
    return this.test(
      'is-base64',
      T['validation.string.invalidFormat'],
      (value) => isBase64(value)
    )
  })
  addMethod(string, 'includesInOptions', function (options, separator = ',') {
    return this.test({
      name: 'includes-string-of-values',
      message: [T['validation.string.invalidFormat'], options.join(separator)],
      exclusive: true,
      test: function (values) {
        return values
          ?.split(separator)
          ?.every((value) => this.resolve(options).includes(value))
      },
    })
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
      oneOf: ({ values }) => ({ word: T['validation.mixed.oneOf'], values }),
      notOneOf: ({ values }) => ({
        word: T['validation.mixed.notOneOf'],
        values,
      }),
      notType: ({ type }) =>
        T[`validation.mixed.notType.${type}`] ?? T['validation.mixed.notType'],
    },
    string: {
      length: ({ length }) => ({
        word: T['validation.string.length'],
        values: length,
      }),
      min: ({ min }) => ({
        word: T['validation.string.min'],
        values: min,
      }),
      max: ({ max }) => ({
        word: T['validation.string.max'],
        values: max,
      }),
      matches: ({ matches }) => ({
        word: T['validation.string.matches'],
        values: matches,
      }),
      email: () => T['validation.string.email'],
      url: () => T['validation.string.url'],
      uuid: () => T['validation.string.uuid'],
      trim: () => T['validation.string.trim'],
      lowercase: () => T['validation.string.lowercase'],
      uppercase: () => T['validation.string.uppercase'],
    },
    number: {
      min: ({ min }) => ({
        word: T['validation.number.min'],
        values: min,
      }),
      max: ({ max }) => ({
        word: T['validation.number.max'],
        values: max,
      }),
      lessThan: ({ less }) => ({
        word: T['validation.number.lessThan'],
        values: less,
      }),
      moreThan: ({ more }) => ({
        word: T['validation.number.moreThan'],
        values: more,
      }),
      positive: () => T['validation.number.positive'],
      negative: () => T['validation.number.negative'],
      integer: () => T['validation.number.integer'],
    },
    boolean: {
      isValue: ({ value }) => ({
        word: T['validation.boolean.isValue'],
        values: [value],
      }),
    },
    date: {
      min: ({ min }) => ({
        word: T['validation.date.min'],
        values: min,
      }),
      max: ({ max }) => ({
        word: T['validation.date.max'],
        values: max,
      }),
    },
    object: {
      noUnknown: ({ nounknown }) => ({
        word: T['validation.object.noUnknown'],
        values: nounknown,
      }),
    },
    array: {
      min: ({ min }) => ({
        word: T['validation.array.min'],
        values: min,
      }),
      max: ({ max }) => ({
        word: T['validation.array.max'],
        values: max,
      }),
      length: ({ length }) => ({
        word: T['validation.array.length'],
        values: length,
      }),
    },
  })
}

export { buildTranslationLocale }
