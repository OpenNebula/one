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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'

import { List } from 'client/components/Tabs/Common'
import { T, VNetwork } from 'client/constants'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {VNetwork} props.vnet - Virtual Network resource
 * @returns {ReactElement} Information tab
 */
const QOSPanel = ({ vnet = {} }) => {
  const {
    INBOUND_AVG_BW,
    INBOUND_PEAK_BW,
    INBOUND_PEAK_KB,
    OUTBOUND_AVG_BW,
    OUTBOUND_PEAK_BW,
    OUTBOUND_PEAK_KB,
  } = vnet.TEMPLATE

  const inbound = [
    {
      name: T.AverageBandwidth,
      value: INBOUND_AVG_BW?.concat(' KBytes/s') ?? '-',
      dataCy: 'inbound-avg',
    },
    {
      name: T.PeakBandwidth,
      value: INBOUND_PEAK_BW?.concat(' KBytes/s') ?? '-',
      dataCy: 'inbound-peak-bandwidth',
    },
    {
      name: T.PeakBurst,
      value: INBOUND_PEAK_KB?.concat(' KBytes') ?? '-',
      dataCy: 'inbound-peak',
    },
  ]

  const outbound = [
    {
      name: T.AverageBandwidth,
      value: OUTBOUND_AVG_BW?.concat(' KBytes/s') ?? '-',
      dataCy: 'outbound-avg',
    },
    {
      name: T.PeakBandwidth,
      value: OUTBOUND_PEAK_BW?.concat(' KBytes/s') ?? '-',
      dataCy: 'outbound-peak-bandwidth',
    },
    {
      name: T.PeakBurst,
      value: OUTBOUND_PEAK_KB?.concat(' KBytes') ?? '-',
      dataCy: 'outbound-peak',
    },
  ]

  return (
    <>
      <List title={T.Inbound} list={inbound} />
      <List title={T.Outbound} list={outbound} />
    </>
  )
}

QOSPanel.propTypes = { vnet: PropTypes.object }
QOSPanel.displayName = 'QOSPanel'

export default QOSPanel
