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
import { ZONE_FIELD_NAME } from 'client/components/Forms/Vdc/CreateForm/Steps/Resources/ZonesSelect/schema'
import { ClustersTable } from 'client/components/Tables'
import { INPUT_TYPES, T } from 'client/constants'
import { Field, getValidationFromFields } from 'client/utils'
import { ObjectSchema, array, object, string } from 'yup'

export const CLUSTER_FIELD_NAME = 'CLUSTER_Z'

/** @type {Field} Cluster field */
const CLUSTER = (zoneId) => ({
  name: `${CLUSTER_FIELD_NAME}${zoneId}`,
  dependOf: `$resources.${ZONE_FIELD_NAME}`,
  htmlType: ([_, selectedZoneId = '0'] = []) =>
    zoneId !== selectedZoneId && INPUT_TYPES.HIDDEN,
  label: T.SelectClusters,
  type: INPUT_TYPES.TABLE,
  Table: () => ClustersTable,
  singleSelect: false,
  zoneId: zoneId,
  validation: array(string().trim()).default(() => []),
  fieldProps: {
    preserveState: true,
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
    fields.push(CLUSTER(zone.ID))
  })

  return fields
}

/**
 * @param {Array[Object]} zones - zone objects
 * @returns {ObjectSchema} Schema
 */
export const SCHEMA = (zones = []) =>
  object(getValidationFromFields(FIELDS(zones)))
