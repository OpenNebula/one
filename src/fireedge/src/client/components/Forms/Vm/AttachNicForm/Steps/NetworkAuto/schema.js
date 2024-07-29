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
import { string, ObjectSchema } from 'yup'

import {
  Field,
  Section,
  getObjectSchemaFromFields,
  disableFields,
} from 'client/utils'
import { T, INPUT_TYPES } from 'client/constants'

const SCHED_REQUIREMENTS = {
  name: 'SCHED_REQUIREMENTS',
  label: T.CustomExpression,
  tooltip: T.NetReqTooltip,
  dependOf: '$advanced.NETWORK_MODE',
  type: INPUT_TYPES.TEXT,
  htmlType: (netMode) => !netMode && INPUT_TYPES.HIDDEN,
  validation: string(),
  grid: { md: 12 },
}

const SCHED_RANK = {
  name: 'SCHED_RANK',
  label: T.CustomExpression,
  tooltip: T.NetRankTooltip,
  type: INPUT_TYPES.TEXT,
  dependOf: '$advanced.NETWORK_MODE',
  htmlType: (netMode) => !netMode && INPUT_TYPES.HIDDEN,
  validation: string(),
  grid: { md: 12 },
}

const VNET_REQ_FIELDS = [SCHED_REQUIREMENTS]

const VNET_RANK_FIELDS = [SCHED_RANK]

/**
 * @param {object} data - VM or VM Template data
 * @param {object} data.oneConfig - Config of oned.conf
 * @param {boolean} data.adminGroup - User is admin or not
 * @returns {Section[]} Sections
 */
const SECTIONS = ({ oneConfig, adminGroup } = {}) => {
  const sections = [
    {
      id: 'network-rank',
      legend: T.NetRank,
      fields: disableFields(VNET_RANK_FIELDS, 'NIC', oneConfig, adminGroup),
    },
    {
      id: 'network-requirements',
      legend: T.NetReq,
      fields: disableFields(VNET_REQ_FIELDS, 'NIC', oneConfig, adminGroup),
    },
  ]

  return sections
}

/**
 * @param {object} data - VM or VM Template data
 * @returns {Field[]} Advanced options schema
 */
const FIELDS = (data) =>
  SECTIONS(data)
    .map(({ fields }) => fields)
    .flat()

/**
 * @param {object} data - VM or VM Template data
 * @returns {ObjectSchema} Advanced options schema
 */
const SCHEMA = (data) => getObjectSchemaFromFields(FIELDS(data))

export { SECTIONS, FIELDS, SCHEMA }
