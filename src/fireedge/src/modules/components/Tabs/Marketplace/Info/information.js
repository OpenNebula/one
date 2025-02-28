/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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

import { MarketplaceAPI } from '@FeaturesModule'
import { StatusChip, LinearProgressWithLabel } from '@modules/components/Status'
import { List } from '@modules/components/Tabs/Common'

import { getMarketplaceState, getMarketplaceCapacityInfo } from '@ModelsModule'
import {
  T,
  Marketplace,
  MARKETPLACE_ACTIONS,
  MARKET_THRESHOLD,
} from '@ConstantsModule'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {Marketplace} props.marketplace - Marketplace resource
 * @param {string[]} props.actions - Available actions to information tab
 * @returns {ReactElement} Information tab
 */
const InformationPanel = ({ marketplace = {}, actions }) => {
  const [rename] = MarketplaceAPI.useRenameMarketplaceMutation()

  const { ID, NAME, MARKET_MAD } = marketplace

  const { color: stateColor, name: stateName } =
    getMarketplaceState(marketplace)
  const { percentOfUsed, percentLabel } =
    getMarketplaceCapacityInfo(marketplace)

  const handleRename = async (_, newName) => {
    await rename({ id: ID, name: newName })
  }

  const info = [
    { name: T.ID, value: ID, dataCy: 'id' },
    {
      name: T.Name,
      value: NAME,
      dataCy: 'name',
      canEdit: actions?.includes?.(MARKETPLACE_ACTIONS.RENAME),
      handleEdit: handleRename,
    },
    {
      name: T.Driver,
      value: <StatusChip text={MARKET_MAD} />,
      dataCy: 'market_mad',
    },
    {
      name: T.State,
      value: <StatusChip text={stateName} stateColor={stateColor} />,
      dataCy: 'state',
    },
    {
      name: T.Capacity,
      value: (
        <LinearProgressWithLabel
          value={percentOfUsed}
          label={percentLabel}
          high={MARKET_THRESHOLD.CAPACITY.high}
          low={MARKET_THRESHOLD.CAPACITY.low}
        />
      ),
      dataCy: 'capacity',
    },
  ]

  return (
    <>
      <List
        title={T.Information}
        list={info}
        containerProps={{ sx: { gridRow: 'span 2' } }}
      />
    </>
  )
}

InformationPanel.propTypes = {
  marketplace: PropTypes.object,
  actions: PropTypes.arrayOf(PropTypes.string),
}

InformationPanel.displayName = 'InformationPanel'

export default InformationPanel
