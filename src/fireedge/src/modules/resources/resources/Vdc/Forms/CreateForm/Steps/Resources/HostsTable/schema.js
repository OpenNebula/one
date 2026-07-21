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
import { CLUSTER_FIELD_NAME } from '@modules/resources/resources/Vdc/Forms/CreateForm/Steps/Resources/ClustersTable/schema'
import { ZONE_FIELD_NAME } from '@modules/resources/resources/Vdc/Forms/CreateForm/Steps/Resources/ZonesSelect/schema'
import { hostSelectionTable } from '@ModelsModule'
import { INPUT_TYPES, T } from '@ConstantsModule'
import { Field, getValidationFromFields } from '@UtilsModule'
import { ObjectSchema, array, object, string } from 'yup'

const getHostModel = (zoneId) => ({
  dataCy: 'hosts',
  columns: hostSelectionTable.columns,
  useData: (_args, options) =>
    hostSelectionTable.useData({ zone: zoneId }, options),
})

/** @type {Field} Cluster field */
const HOST = (zoneId) => ({
  name: `HOST_Z${zoneId}`,
  dependOf: [
    `$resources.${ZONE_FIELD_NAME}`,
    `$resources.${CLUSTER_FIELD_NAME}${zoneId}`,
  ],
  htmlType: ([selectedZoneId = '0'] = []) =>
    zoneId !== selectedZoneId && INPUT_TYPES.HIDDEN,
  label: T.SelectHosts,
  type: INPUT_TYPES.TABLE,
  model: getHostModel(zoneId),
  selectOnRowClick: true,
  singleSelect: false,
  validation: array(string().trim()).default(() => []),
  fieldProps: {
    preserveState: true,
    isEnableSearchBar: true,
    isCopyColumn: true,
    size: 'medium',
    // The second parameter of the function filters the results that are found in dependOf
    filter: (data, [_, clusters]) => {
      const selectedClusters = []
        .concat(clusters ?? [])
        .filter(Boolean)
        .map(String)

      return selectedClusters.length
        ? data.filter((item) =>
            []
              .concat(item.CLUSTER_ID ?? [])
              .filter(Boolean)
              .map(String)
              .some((id) => !selectedClusters.includes(id))
          )
        : data
    },
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
    fields.push(HOST(zone.ID))
  })

  return fields
}

/**
 * @param {Array[Object]} zones - zone objects
 * @returns {ObjectSchema} Schema
 */
export const SCHEMA = (zones = []) =>
  object(getValidationFromFields(FIELDS(zones)))
