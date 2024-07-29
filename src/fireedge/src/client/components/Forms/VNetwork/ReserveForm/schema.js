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
import { BaseSchema, string, number } from 'yup'

import { useGetVNetworksQuery } from 'client/features/OneApi/network'
import { getAddressType } from 'client/models/VirtualNetwork'
import {
  Field,
  getObjectSchemaFromFields,
  OPTION_SORTERS,
  arrayToOptions,
  REG_ADDR,
} from 'client/utils'
import { T, INPUT_TYPES, VirtualNetwork, AddressRange } from 'client/constants'

const SWITCH_TYPES = { newVnet: 'vnet', fromAr: 'ar' }

const SWITCH_STR = {
  [SWITCH_TYPES.newVnet]: T.AddToNewVirtualNetwork,
  [SWITCH_TYPES.fromAr]: T.AddToExistingReservation,
}

/** @type {Field} Number of addresses field */
const SIZE_FIELD = {
  name: 'SIZE',
  label: T.NumberOfAddresses,
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: number()
    .positive()
    .required()
    .default(() => 1),
}

/** @type {Field} Switcher for vnet OR existing reservation */
const SWITCH_FIELD = {
  name: '__SWITCH__',
  type: INPUT_TYPES.TOGGLE,
  values: () =>
    arrayToOptions(Object.entries(SWITCH_STR), {
      addEmpty: false,
      getText: ([, text]) => text,
      getValue: ([value]) => value,
    }),
  validation: string()
    .trim()
    .required()
    .default(() => SWITCH_TYPES.newVnet)
    .afterSubmit(() => undefined),
  grid: { sm: 12, md: 12 },
  notNull: true,
}

/** @type {Field} Name of the new virtual network */
const NAME_FIELD = {
  name: 'NAME',
  label: T.Name,
  type: INPUT_TYPES.TEXT,
  dependOf: SWITCH_FIELD.name,
  htmlType: (switcher) =>
    switcher === SWITCH_TYPES.fromAr && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .default(() => undefined)
    .when(SWITCH_FIELD.name, {
      is: SWITCH_TYPES.fromAr,
      then: (schema) => schema.strip(),
      otherwise: (schema) => schema.required(),
    }),
}

/**
 * @param {object} stepProps - Step props
 * @param {VirtualNetwork} stepProps.vnet - Virtual Network
 * @returns {Field} Add to an existing reservation
 */
const EXISTING_RESERVE_FIELD = ({ vnet = {} }) => ({
  name: 'NETWORK_ID',
  label: T.SelectNetwork,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  dependOf: SWITCH_FIELD.name,
  htmlType: (switcher) =>
    switcher === SWITCH_TYPES.newVnet && INPUT_TYPES.HIDDEN,
  values: () => {
    const { data: reservedVNets } = useGetVNetworksQuery(undefined, {
      selectFromResult: ({ data: result = [] }) => ({
        data: result?.filter((vn) => +vn?.PARENT_NETWORK_ID === +vnet.ID),
      }),
    })

    return arrayToOptions(reservedVNets, {
      getText: ({ ID, NAME }) => `#${ID} ${NAME}`,
      getValue: ({ ID }) => ID,
      sorter: OPTION_SORTERS.numeric,
    })
  },
  validation: string()
    .trim()
    .default(() => undefined)
    .when(SWITCH_FIELD.name, {
      is: SWITCH_TYPES.newVnet,
      then: (schema) => schema.strip(),
      otherwise: (schema) => schema.required(),
    }),
})

/**
 * @param {object} stepProps - Step props
 * @param {AddressRange[]} stepProps.arPool - Address Ranges
 * @returns {Field} Add to an existing reservation
 */
const AR_FIELD = ({ arPool = {} }) => ({
  name: 'AR_ID',
  label: T.CanSelectAddressFromAR,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  dependOf: SWITCH_FIELD.name,
  values: arrayToOptions(arPool, {
    getText: ({ AR_ID, IP, MAC }) =>
      `#${AR_ID} ${IP ? 'IP' : 'MAC'} range: ${IP ?? MAC}`,
    getValue: ({ AR_ID }) => AR_ID,
    sorter: OPTION_SORTERS.numeric,
  }),
  validation: string()
    .trim()
    .default(() => undefined),
})

/** @type {Field} First address field */
const ADDR_FIELD = {
  name: 'ADDR',
  label: T.FirstAddress,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .notRequired()
    .matches(REG_ADDR, { message: T.InvalidAddress })
    .default(() => undefined),
  fieldProps: { placeholder: T.IpOrMac },
}

/**
 * @param {object} stepProps - Step props
 * @param {VirtualNetwork} stepProps.vnet - Virtual network
 * @returns {Field[]} Fields
 */
const FIELDS = (stepProps) => {
  const arPool = [stepProps?.vnet?.AR_POOL?.AR ?? []].flat()

  return [
    SWITCH_FIELD,
    SIZE_FIELD,
    NAME_FIELD,
    EXISTING_RESERVE_FIELD(stepProps),
    arPool.length > 0 && AR_FIELD({ arPool }),
    ADDR_FIELD,
  ].filter(Boolean)
}

/**
 * @param {object} stepProps - Step props
 * @param {VirtualNetwork} stepProps.vnet - Virtual network
 * @returns {BaseSchema} Schema
 */
const SCHEMA = (stepProps) =>
  getObjectSchemaFromFields([...FIELDS(stepProps)]).afterSubmit(
    ({ [ADDR_FIELD.name]: addr, ...result }) => {
      const addrType = getAddressType(addr)
      addrType && (result[addrType] = addr)

      return result
    }
  )

export { FIELDS, SCHEMA }
