/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { object, ObjectSchema, string } from 'yup'

import { INPUT_TYPES, T } from '@ConstantsModule'
import { arrayToOptions, Field, getValidationFromFields } from '@UtilsModule'

const getAddressRangeId = (addressRange) =>
  addressRange?.AR_ID ?? addressRange?.INDEX

const getAddressRangeLabel = (addressRange = {}) => {
  const address = [addressRange.IP, addressRange.IP6, addressRange.MAC].find(
    Boolean
  )
  const size = addressRange.SIZE ? `${T.Size}: ${addressRange.SIZE}` : ''

  return [`#${getAddressRangeId(addressRange)}`, address, size && `(${size})`]
    .filter(Boolean)
    .join(' ')
}

/** @type {Field} Address range field */
const ADDRESS_RANGE = ({ addressRanges = [] }) => ({
  name: 'arId',
  label: T.AddressRange,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: () =>
    arrayToOptions(addressRanges, {
      addEmpty: false,
      getText: getAddressRangeLabel,
      getValue: (addressRange) => String(getAddressRangeId(addressRange)),
    }),
  grid: { md: 12 },
  validation: string()
    .trim()
    .required()
    .default(() => {
      const [firstAddressRange] = addressRanges

      return firstAddressRange
        ? String(getAddressRangeId(firstAddressRange))
        : undefined
    }),
})

/** @type {Field[]} List of fields */
export const FIELDS = (params) => [ADDRESS_RANGE(params)]

/** @type {ObjectSchema} Schema */
export const SCHEMA = (params) =>
  object(getValidationFromFields(FIELDS(params)))
