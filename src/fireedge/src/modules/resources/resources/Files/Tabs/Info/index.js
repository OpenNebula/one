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
  AttributesPanel,
  DetailsCard,
  OwnershipTab,
  PermissionsTab,
  ResourceLink,
  StatusTag,
} from '@ComponentsV2Module'
import { RESOURCE_NAMES, T } from '@ConstantsModule'
import {
  aggregateOwnership,
  aggregatePermissions,
  booleanToString,
  getImageType,
  levelLockToString,
  prettyBytes,
  timeToString,
} from '@UtilsModule'
import { getDiskType, getImageState } from '@ModelsModule'
import { getStyles } from '@modules/resources/resources/Files/Tabs/Info/styles'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - File info tab
 */
export const Info = ({ data, config }) => {
  const {
    selected,
    handleChangePermission,
    handleChangeOwnership,
    isActionsDisabled,
    isLocked,
    isMutating,
    attributes,
    handleDeleteAttribute,
    handleAddAttribute,
    handleEditAttribute,
    isLoadingData,
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

  const file = aSelected.length === 1 ? aSelected[0] : {}
  const {
    ID,
    NAME,
    SIZE,
    PERSISTENT,
    LOCK,
    REGTIME,
    DATASTORE_ID,
    DATASTORE = '--',
    VMS,
  } = file

  const { name: stateName, color: stateColor } = useMemo(
    () => getImageState(file) ?? {},
    [file]
  )

  const fileTypeName = useMemo(() => getImageType(file), [file])
  const fileDiskTypeName = useMemo(() => getDiskType(file), [file])
  const hasDatastore =
    DATASTORE_ID !== undefined &&
    DATASTORE_ID !== null &&
    !Number.isNaN(+DATASTORE_ID)

  const info = [
    { name: T.ID, value: ID, dataCy: 'id' },
    {
      name: T.Name,
      value: NAME,
      dataCy: 'name',
    },
    DATASTORE_ID !== undefined &&
      DATASTORE_ID !== null && {
        name: T.Datastore,
        value: hasDatastore ? (
          <ResourceLink
            resource={RESOURCE_NAMES.DATASTORE}
            data={{ ID: DATASTORE_ID, NAME: DATASTORE }}
          >
            {`#${DATASTORE_ID} ${DATASTORE}`}
          </ResourceLink>
        ) : (
          `#${DATASTORE_ID} ${DATASTORE}`
        ),
        dataCy: 'datastoreId',
      },
    {
      name: T.RegistrationTime,
      value: timeToString(REGTIME),
      dataCy: 'regtime',
    },
    {
      name: T.Type,
      value: fileTypeName,
      dataCy: 'type',
    },
    {
      name: T.DiskType,
      value: fileDiskTypeName,
      dataCy: 'diskType',
    },
    {
      name: T.Locked,
      value: levelLockToString(LOCK?.LOCKED),
      dataCy: 'locked',
    },
    {
      name: T.Persistent,
      value: booleanToString(+PERSISTENT),
      dataCy: 'persistent',
    },
    {
      name: T.Size,
      value: prettyBytes(SIZE, 'MB'),
      dataCy: 'size',
    },
    {
      name: T.State,
      value: (
        <StatusTag
          key="file-state"
          dataCy="file-state"
          statusColor={stateColor}
          statusName={stateName}
        />
      ),
      dataCy: 'state',
    },
    {
      name: T.RunningVMs,
      value: `${[VMS?.ID ?? []].flat().length || 0}`,
    },
  ].filter(Boolean)

  return (
    <Box key={'File-Permissions-Tab'} sx={(theme) => getStyles({ theme })}>
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
                isDisabled={isLocked || isActionsDisabled || isMutating}
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
                isDisabled={isLocked || isActionsDisabled || isMutating}
              />
            )}
          </Box>
        </Box>
      </Box>
      {attributesPanel?.enabled && aSelected.length === 1 && (
        <Box className="attributesContainer">
          <AttributesPanel
            title={T.Attributes}
            attributes={attributes ?? []}
            actions={attributesPanel?.actions}
            handleDelete={handleDeleteAttribute}
            handleAdd={handleAddAttribute}
            handleEdit={handleEditAttribute}
            isLoading={isLoadingData}
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
