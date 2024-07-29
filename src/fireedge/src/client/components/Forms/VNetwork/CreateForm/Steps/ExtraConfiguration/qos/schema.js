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
import { ObjectSchema, string } from 'yup'

import {
  Field,
  Section,
  getObjectSchemaFromFields,
  disableFields,
} from 'client/utils'
import { T, INPUT_TYPES, RESTRICTED_ATTRIBUTES_TYPE } from 'client/constants'

const commonFieldProps = {
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: string().trim().notRequired(),
}

/** @type {Field} Inbound AVG Bandwidth field */
const INBOUND_AVG_BW_FIELD = {
  ...commonFieldProps,
  name: 'INBOUND_AVG_BW',
  label: T.AverageBandwidth,
  tooltip: T.InboundAverageBandwidthConcept,
}

/** @type {Field} Inbound Peak Bandwidth field */
const INBOUND_PEAK_BW_FIELD = {
  ...commonFieldProps,
  name: 'INBOUND_PEAK_BW',
  label: T.PeakBandwidth,
  tooltip: T.InboundPeakBandwidthConcept,
}

/** @type {Field} Inbound Peak Burst field */
const INBOUND_PEAK_KB_FIELD = {
  ...commonFieldProps,
  name: 'INBOUND_PEAK_KB',
  label: T.PeakBurst,
  tooltip: T.PeakBurstConcept,
}

/** @type {Field} Outbound AVG Bandwidth field */
const OUTBOUND_AVG_BW_FIELD = {
  ...commonFieldProps,
  name: 'OUTBOUND_AVG_BW',
  label: T.AverageBandwidth,
  tooltip: T.OutboundAverageBandwidthConcept,
}

/** @type {Field} Outbound Peak Bandwidth field */
const OUTBOUND_PEAK_BW_FIELD = {
  ...commonFieldProps,
  name: 'OUTBOUND_PEAK_BW',
  label: T.PeakBandwidth,
  tooltip: T.OutboundPeakBandwidthConcept,
}

/** @type {Field} Outbound Peak Burst field */
const OUTBOUND_PEAK_KB_FIELD = {
  ...commonFieldProps,
  name: 'OUTBOUND_PEAK_KB',
  label: T.PeakBurst,
  tooltip: T.PeakBurstConcept,
}

/** @type {Section[]} Sections */
const SECTIONS = (oneConfig, adminGroup) => [
  {
    id: 'qos-inbound',
    legend: T.InboundTraffic,
    fields: disableFields(
      [INBOUND_AVG_BW_FIELD, INBOUND_PEAK_BW_FIELD, INBOUND_PEAK_KB_FIELD],
      '',
      oneConfig,
      adminGroup,
      RESTRICTED_ATTRIBUTES_TYPE.VNET
    ),
  },
  {
    id: 'qos-outbound',
    legend: T.OutboundTraffic,
    fields: disableFields(
      [OUTBOUND_AVG_BW_FIELD, OUTBOUND_PEAK_BW_FIELD, OUTBOUND_PEAK_KB_FIELD],
      '',
      oneConfig,
      adminGroup,
      RESTRICTED_ATTRIBUTES_TYPE.VNET
    ),
  },
]

/** @type {Field[]} List of QoS fields */
const FIELDS = (oneConfig, adminGroup) =>
  SECTIONS(oneConfig, adminGroup)
    .map(({ fields }) => fields)
    .flat()

/** @type {ObjectSchema} QoS schema */
const SCHEMA = (oneConfig, adminGroup) =>
  getObjectSchemaFromFields(FIELDS(oneConfig, adminGroup))

export { SCHEMA, SECTIONS, FIELDS }
