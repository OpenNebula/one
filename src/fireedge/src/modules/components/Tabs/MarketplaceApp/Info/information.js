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
import { generatePath } from 'react-router'

import { MarketplaceAppAPI } from '@FeaturesModule'
import { StatusChip } from '@modules/components/Status'
import { List } from '@modules/components/Tabs/Common'

import {
  getMarketplaceAppType,
  getMarketplaceAppState,
  levelLockToString,
} from '@ModelsModule'
import { prettyBytes } from '@UtilsModule'
import { T, MARKETPLACE_APP_ACTIONS, MarketplaceApp } from '@ConstantsModule'
import { PATH } from '@modules/components/path'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {MarketplaceApp} props.app - Marketplace App resource
 * @param {string[]} props.actions - Available actions to information tab
 * @returns {ReactElement} Information tab
 */
const InformationPanel = ({ app = {}, actions }) => {
  const [rename] = MarketplaceAppAPI.useRenameAppMutation()

  const { ID, NAME, LOCK, MARKETPLACE, MARKETPLACE_ID, SIZE, FORMAT, VERSION } =
    app

  const typeName = getMarketplaceAppType(app)
  const { name: stateName, color: stateColor } = getMarketplaceAppState(app)

  const handleRename = async (_, newName) => {
    await rename({ id: ID, name: newName })
  }

  const info = [
    { name: T.ID, value: ID, dataCy: 'id' },
    {
      name: T.Name,
      value: NAME,
      canEdit: actions?.includes?.(MARKETPLACE_APP_ACTIONS.RENAME),
      handleEdit: handleRename,
      dataCy: 'name',
    },
    {
      name: T.Marketplace,
      value: `#${MARKETPLACE_ID} ${MARKETPLACE}`,
      link:
        !Number.isNaN(+MARKETPLACE_ID) &&
        generatePath(PATH.STORAGE.MARKETPLACES.DETAIL, { id: MARKETPLACE_ID }),
    },
    { name: T.Type, value: <StatusChip text={typeName} /> },
    { name: T.Size, value: prettyBytes(SIZE, 'MB') },
    {
      name: T.State,
      value: <StatusChip text={stateName} stateColor={stateColor} />,
      dataCy: 'state',
    },
    {
      name: T.Locked,
      value: levelLockToString(LOCK?.LOCKED),
      dataCy: 'locked',
    },
    { name: T.Format, value: FORMAT },
    { name: T.Version, value: VERSION },
  ]

  return (
    <List
      title={T.Information}
      list={info}
      containerProps={{ sx: { gridRow: 'span 3' } }}
    />
  )
}

InformationPanel.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.string),
  app: PropTypes.object,
}

InformationPanel.displayName = 'InformationPanel'

export default InformationPanel
