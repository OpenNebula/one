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
import { Component, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import {
  DetailsCard,
  PermissionsTab,
  OwnershipTab,
  AttributesPanel,
  StatusTag,
  ProgressBar,
  Tag,
} from '@ComponentsV2Module'
import { T, DS_THRESHOLD } from '@ConstantsModule'
import {
  aggregateOwnership,
  aggregatePermissions,
  prettyBytes,
} from '@UtilsModule'
import {
  getDatastoreCapacityInfo,
  getDatastoreState,
  getDatastoreType,
} from '@ModelsModule'
import { getStyles } from '@modules/resources/resources/Datastore/Tabs/Info/styles'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - Datastore info tab
 */
export const Info = ({ data, config }) => {
  const {
    selected,
    handleChangePermission,
    handleChangeOwnership,
    isActionsDisabled,
    attributes,
    handleEditAttribute,
    handleDeleteAttribute,
    handleAddAttribute,
  } = data || {}

  const {
    information_panel: informationPanel,
    ownership_panel: ownershipPanel,
    permissions_panel: permissionsPanel,
    attributes_panel: attributesPanel,
  } = config || {}

  const aSelected = [].concat(selected).filter(Boolean)

  const aggregatedPermissions = useMemo(
    () => aggregatePermissions(aSelected),
    [aSelected]
  )

  const aggregatedOwnership = useMemo(
    () => aggregateOwnership(aSelected),
    [aSelected]
  )

  const datastore = aSelected.length === 1 ? aSelected[0] : {}
  const { ID, NAME, BASE_PATH, DS_MAD, TM_MAD, TEMPLATE = {} } = datastore

  const { percentOfUsed, percentLabel } = useMemo(
    () => getDatastoreCapacityInfo(datastore),
    [datastore]
  )
  const { color: stateColor, name: stateName } = useMemo(
    () => getDatastoreState(datastore) ?? {},
    [datastore]
  )
  const dsTypeName = useMemo(() => getDatastoreType(datastore), [datastore])
  const limit = TEMPLATE?.LIMIT_MB
    ? prettyBytes(TEMPLATE.LIMIT_MB, 'MB', 1)
    : '-'

  const info = [
    { name: T.ID, value: ID, dataCy: 'id' },
    {
      name: T.Name,
      value: NAME,
    },
    {
      name: T.State,
      value: (
        <StatusTag
          statusColor={stateColor}
          statusName={stateName}
          dataCy="datastore-state"
          key="datastore-state"
        />
      ),
    },
    {
      name: T.Type,
      value: dsTypeName ? <Tag title={dsTypeName} status="default" /> : '-',
    },
    {
      name: T.DatastoreDriver,
      value: DS_MAD ? <Tag title={DS_MAD} status="default" /> : '-',
    },
    {
      name: T.TransferDriver,
      value: TM_MAD ? <Tag title={TM_MAD} status="default" /> : '-',
    },
    { name: T.BasePath, value: BASE_PATH },
    {
      name: T.Capacity,
      value: (
        <ProgressBar
          value={percentOfUsed}
          label={percentLabel}
          thresholds={[DS_THRESHOLD.CAPACITY.low, DS_THRESHOLD.CAPACITY.high]}
          isLabelVisible
        />
      ),
    },
    { name: T.Limit, value: limit },
  ]

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <Box className="mainContainer">
        <Box className="permsInfoContainer">
          {informationPanel?.enabled && aSelected.length === 1 && (
            <Box className="detailsContainer">
              <DetailsCard
                title={T.Information}
                options={info.map(({ name, value }) => [name, value ?? '-'])}
              />
            </Box>
          )}
          <Box className="permissionsOwnershipContainer">
            {permissionsPanel?.enabled && (
              <PermissionsTab
                title={T.Permissions}
                actions={permissionsPanel?.actions}
                options={{
                  ownerUse: aggregatedPermissions?.OWNER_U,
                  ownerManage: aggregatedPermissions?.OWNER_M,
                  ownerAdmin: aggregatedPermissions?.OWNER_A,
                  groupUse: aggregatedPermissions?.GROUP_U,
                  groupManage: aggregatedPermissions?.GROUP_M,
                  groupAdmin: aggregatedPermissions?.GROUP_A,
                  otherUse: aggregatedPermissions?.OTHER_U,
                  otherManage: aggregatedPermissions?.OTHER_M,
                  otherAdmin: aggregatedPermissions?.OTHER_A,
                }}
                handleEdit={handleChangePermission}
                isDisabled={isActionsDisabled}
              />
            )}
            {ownershipPanel?.enabled && (
              <OwnershipTab
                title={T.Ownership}
                actions={ownershipPanel?.actions}
                userId={+aggregatedOwnership?.UID}
                userName={aggregatedOwnership?.UNAME}
                groupId={+aggregatedOwnership?.GID}
                groupName={aggregatedOwnership?.GNAME}
                handleEdit={handleChangeOwnership}
                isDisabled={isActionsDisabled}
              />
            )}
          </Box>
        </Box>
      </Box>
      {aSelected?.length === 1 && attributesPanel?.enabled && (
        <Box className="attributesContainer">
          <AttributesPanel
            title={T.Attributes}
            attributes={attributes}
            actions={attributesPanel?.actions}
            handleDelete={handleDeleteAttribute}
            handleAdd={handleAddAttribute}
            handleEdit={handleEditAttribute}
          />
        </Box>
      )}
    </Box>
  )
}

Info.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Info.id = 'info'
Info.title = T.Info

export default Info
