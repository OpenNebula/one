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

import {
  AttributesPanel,
  Button,
  DetailsCard,
  TablePanel as SelectionTable,
} from '@ComponentsV2Module'
import { RESOURCE_NAMES, STYLE_BUTTONS, T } from '@ConstantsModule'
import { GroupAPI, useFunctionalityApi } from '@FeaturesModule'
import { GROUP_LIST_COLUMNS } from '@ModelsModule'
import {
  cloneObject,
  filterAttributes,
  getActionsAvailable,
  jsonToXml,
} from '@UtilsModule'
import { Box, Stack } from '@mui/material'
import { ArrowRight, Cancel as CloseIcon } from 'iconoir-react'
import PropTypes from 'prop-types'
import { Component, useMemo } from 'react'
import { useResourceSingleViewContext } from '@ProvidersModule'

import {
  getGroupId,
  groupTabPropTypes,
} from '@modules/resources/resources/Group/Tabs/common'
import { getStyles } from '@modules/resources/resources/Group/Tabs/Info/styles'

const { useGetGroupQuery, useUpdateGroupMutation } = GroupAPI

const HIDDEN_ATTRIBUTES_REG = /^(SUNSTONE|OPENNEBULA)$/

const getActions = (actions = {}) =>
  getActionsAvailable(actions).reduce(
    (actionsMap, action) => ({ ...actionsMap, [action]: true }),
    {}
  )

const getSelectionColumns = (handleSelect, handleDeselect) => [
  {
    id: 'deselect',
    header: '',
    grow: false,
    cell: ({ row }) => (
      <Button
        type={STYLE_BUTTONS.TYPE.TRANSPARENT}
        size="small"
        iconOnly={<CloseIcon width="16px" height="16px" />}
        onClick={() => handleDeselect?.(row.original.ID)}
      />
    ),
  },
  ...GROUP_LIST_COLUMNS,
  {
    id: 'view',
    header: '',
    grow: false,
    cell: ({ row }) => (
      <Button
        type={STYLE_BUTTONS.TYPE.OUTLINE}
        size="small"
        endIcon={<ArrowRight width="16px" height="16px" />}
        onClick={() => handleSelect?.(row.original)}
      >
        {T.View}
      </Button>
    ),
  },
]

const GroupAggregatedInfo = ({ selectedGroups = [] }) => {
  const { setSelectedItems } = useFunctionalityApi()
  const { openResourceSingleView } = useResourceSingleViewContext()
  const selectedIds = selectedGroups.map(({ ID }) => String(ID))

  const handleSelect = (resource) => {
    if (openResourceSingleView(RESOURCE_NAMES.GROUP, resource)) return

    setSelectedItems([String(resource?.ID)])
  }

  const handleDeselect = (ID) => {
    const id = String(ID)

    setSelectedItems(selectedIds.filter((selectedId) => selectedId !== id))
  }

  return (
    <SelectionTable
      key="selected-groups-table"
      columns={getSelectionColumns(handleSelect, handleDeselect)}
      data={selectedGroups}
    />
  )
}

GroupAggregatedInfo.propTypes = {
  selectedGroups: PropTypes.array,
}

const GroupSingleInfo = ({ data, config }) => {
  const id = getGroupId(data)
  const {
    information_panel: informationPanel,
    attributes_panel: attributesPanel,
  } = config || {}

  const [updateGroup, { isLoading: isUpdatingGroup }] = useUpdateGroupMutation()
  const { data: group = {}, isFetching } = useGetGroupQuery({ id })
  const { ID, NAME, TEMPLATE = {} } = group

  const attributes = useMemo(() => {
    const { attributes: visibleAttributes = {} } = filterAttributes(TEMPLATE, {
      hidden: HIDDEN_ATTRIBUTES_REG,
    })

    return Object.entries(visibleAttributes).map(([key, value]) => ({
      key,
      value,
    }))
  }, [TEMPLATE])

  const handleAddAttribute = async ({ key, value }) => {
    const newTemplate = cloneObject(TEMPLATE)
    newTemplate[key] = value

    await updateGroup({
      id,
      template: jsonToXml(newTemplate),
      replace: 1,
    })
  }

  const handleDeleteAttribute = async (index) => {
    const key = attributes?.[index]?.key
    if (!key) return

    const newTemplate = cloneObject(TEMPLATE)
    delete newTemplate[key]

    await updateGroup({
      id,
      template: jsonToXml(newTemplate),
      replace: 1,
    })
  }

  const isLoading = isFetching || isUpdatingGroup
  const attributeActions = getActions(attributesPanel?.actions)

  return (
    <Stack key={'Group-Info-Tab'} sx={(theme) => getStyles({ theme })}>
      {informationPanel?.enabled && (
        <Box>
          <DetailsCard
            title={T.Information}
            options={[
              [T.ID, ID],
              [T.Name, NAME],
            ]}
          />
        </Box>
      )}
      {attributesPanel?.enabled && (
        <AttributesPanel
          title={T.Attributes}
          attributes={attributes}
          actions={{ ...attributeActions, edit: false }}
          handleAdd={handleAddAttribute}
          handleDelete={handleDeleteAttribute}
          isLoading={isLoading}
          isFullHeight={false}
        />
      )}
    </Stack>
  )
}

GroupSingleInfo.propTypes = groupTabPropTypes

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab slot data payload
 * @param {object} root0.config - Tab config
 * @returns {Component} Group info tab
 */
export const Info = ({ data, config }) => {
  const selectedGroups = Array.isArray(data?.selected)
    ? data.selected.filter(Boolean)
    : []

  if (selectedGroups.length > 0) {
    return <GroupAggregatedInfo selectedGroups={selectedGroups} />
  }

  return <GroupSingleInfo data={data} config={config} />
}

Info.propTypes = groupTabPropTypes

Info.id = 'info'
Info.title = T.Info
