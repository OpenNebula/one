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
import { CLUSTER_FIELD_NAME } from 'client/components/Forms/Vdc/CreateForm/Steps/Resources/ClustersTable/schema'
import { ZONE_FIELD_NAME } from 'client/components/Forms/Vdc/CreateForm/Steps/Resources/ZonesSelect/schema'
import { VNetworksTable } from 'client/components/Tables'
import { INPUT_TYPES, T } from 'client/constants'
import { Field, getValidationFromFields } from 'client/utils'
import { ObjectSchema, array, object, string } from 'yup'

// const ZONE_FIELD_NAME = 'VNET_ZONE_ID'

/** @type {Field} Cluster field */
const VNET = (zoneId) => ({
  name: `VNET_Z${zoneId}`,
  dependOf: [
    `$resources.${ZONE_FIELD_NAME}`,
    `$resources.${CLUSTER_FIELD_NAME}${zoneId}`,
  ],
  htmlType: ([selectedZoneId = '0'] = []) =>
    zoneId !== selectedZoneId && INPUT_TYPES.HIDDEN,
  label: T.SelectVirtualNetworks,
  type: INPUT_TYPES.TABLE,
  Table: () => VNetworksTable,
  singleSelect: false,
  zoneId: zoneId,
  validation: array(string().trim()).default(() => []),
  fieldProps: {
    preserveState: true,
    // The second parameter of the function filters the results that are found in dependOf
    filter: (data, [_, clusters]) =>
      clusters?.length
        ? data.filter((item) => {
            const dataClusters = item.CLUSTERS.ID
            if (Array.isArray(dataClusters)) {
              return dataClusters.some((id) => !clusters.includes(id))
            } else {
              return !clusters.includes(dataClusters)
            }
          })
        : data,
  },
  grid: { md: 12 },
})

/**
 * @param {Array[Object]} zones - zone objects
 * @returns {Field[]} Fields
 */
export const FIELDS = (zones = []) => {
  const fields = []

  zones.forEach((zone) => {
    fields.push(VNET(zone.ID))
  })

  return fields
}

/**
 * @param {Array[Object]} zones - zone objects
 * @returns {ObjectSchema} Schema
 */
export const SCHEMA = (zones = []) =>
  object(getValidationFromFields(FIELDS(zones)))
