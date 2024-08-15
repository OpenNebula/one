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

import {
  setLocale,
  addMethod,
  number,
  string,
  boolean,
  mixed,
  object,
  array,
  date,
} from 'yup'

import { T } from 'client/constants'
import { isDivisibleBy, isBase64 } from 'client/utils/number'

const buildMethods = () => {
  ;[number, string, boolean, mixed, object, array, date].forEach(
    (schemaType) => {
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
          const needChangeAfterSubmit = typeof this.submit === 'function'
          needChangeAfterSubmit && (result = this.submit(result, options))
        }

        return result
      })
    }
  )
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
      default: ({ path }) => `${path} ${T['validation.mixed.default']}`,
      required: ({ path }) => `${path} ${T['validation.mixed.required']}`,
      defined: ({ path }) => `${path} ${T['validation.mixed.defined']}`,
      oneOf: ({ path, values }) =>
        `${path} ${T['validation.mixed.oneOf']}: ${values}`,
      notOneOf: ({ path, values }) =>
        `${path} ${T['validation.mixed.notOneOf']}: ${values}`,
      notType: ({ path, type }) =>
        `${path} ${
          T[`validation.mixed.notType.${type}`] ?? T['validation.mixed.notType']
        }`,
    },
    string: {
      length: ({ path, length }) =>
        `${path} ${T['validation.string.length']}: ${length}`,
      min: ({ path, min }) => `${path} ${T['validation.string.min']}: ${min}`,
      max: ({ path, max }) => `${path} ${T['validation.string.max']}: ${max}`,
      matches: ({ path, matches }) =>
        `${path} ${T['validation.string.matches']}: ${matches}`,
      email: ({ path }) => `${path} ${T['validation.string.email']}`,
      url: ({ path }) => `${path} ${T['validation.string.url']}`,
      uuid: ({ path }) => `${path} ${T['validation.string.uuid']}`,
      trim: ({ path }) => `${path} ${T['validation.string.trim']}`,
      lowercase: ({ path }) => `${path} ${T['validation.string.lowercase']}`,
      uppercase: ({ path }) => `${path} ${T['validation.string.uppercase']}`,
    },
    number: {
      min: ({ path, min }) => `${path} ${T['validation.number.min']}: ${min}`,
      max: ({ path, max }) => `${path} ${T['validation.number.max']}: ${max}`,
      lessThan: ({ path, less }) =>
        `${path} ${T['validation.number.lessThan']}: ${less}`,
      moreThan: ({ path, more }) =>
        `${path} ${T['validation.number.moreThan']}: ${more}`,
      positive: ({ path }) => `${path} ${T['validation.number.positive']}`,
      negative: ({ path }) => `${path} ${T['validation.number.negative']}`,
      integer: ({ path }) => `${path} ${T['validation.number.integer']}`,
    },
    boolean: {
      isValue: ({ path, value }) =>
        `${path} ${T['validation.boolean.isValue']}: ${value}`,
    },
    date: {
      min: ({ path, min }) => `${path} ${T['validation.date.min']}: ${min}`,
      max: ({ path, max }) => `${path} ${T['validation.date.max']}: ${max}`,
    },
    object: {
      noUnknown: ({ path, nounknown }) =>
        `${path} ${T['validation.object.noUnknown']}: ${nounknown}`,
    },
    array: {
      min: ({ path, min }) => `${path} ${T['validation.array.min']}: ${min}`,
      max: ({ path, max }) => `${path} ${T['validation.array.max']}: ${max}`,
      length: ({ path, length }) =>
        `${path} ${T['validation.array.length']}: ${length}`,
    },
  })
}

export { buildTranslationLocale }
