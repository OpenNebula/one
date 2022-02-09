/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import PropTypes from 'prop-types'
import { generatePath } from 'react-router'

import { StatusChip } from 'client/components/Status'
import { List } from 'client/components/Tabs/Common'

import { getType, getState } from 'client/models/MarketplaceApp'
import { timeToString, levelLockToString } from 'client/models/Helper'
import { prettyBytes } from 'client/utils'
import { T, MARKETPLACE_APP_ACTIONS } from 'client/constants'
import { PATH } from 'client/apps/sunstone/routesOne'

const InformationPanel = ({ marketplaceApp = {}, handleRename, actions }) => {
  const {
    ID,
    NAME,
    REGTIME,
    LOCK,
    MARKETPLACE,
    MARKETPLACE_ID,
    SIZE,
    FORMAT,
    VERSION,
  } = marketplaceApp
  const typeName = getType(marketplaceApp)
  const { name: stateName, color: stateColor } = getState(marketplaceApp)

  const info = [
    { name: T.ID, value: ID },
    {
      name: T.Name,
      value: NAME,
      canEdit: actions?.includes?.(MARKETPLACE_APP_ACTIONS.RENAME),
      handleEdit: handleRename,
    },
    {
      name: T.Marketplace,
      value: `#${MARKETPLACE_ID} ${MARKETPLACE}`,
      link:
        !Number.isNaN(+MARKETPLACE_ID) &&
        generatePath(PATH.STORAGE.MARKETPLACES.DETAIL, { id: MARKETPLACE_ID }),
    },
    {
      name: T.StartTime,
      value: timeToString(REGTIME),
    },
    { name: T.Type, value: typeName },
    { name: T.Size, value: prettyBytes(SIZE, 'MB') },
    {
      name: T.State,
      value: <StatusChip text={stateName} stateColor={stateColor} />,
    },
    { name: T.Locked, value: levelLockToString(LOCK?.LOCKED) },
    { name: T.Format, value: FORMAT },
    { name: T.Version, value: VERSION },
  ]

  return (
    <List
      title={T.Information}
      list={info}
      containerProps={{ style: { gridRow: 'span 3' } }}
    />
  )
}

InformationPanel.displayName = 'InformationPanel'

InformationPanel.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.string),
  handleRename: PropTypes.func,
  marketplaceApp: PropTypes.object,
}

export default InformationPanel
