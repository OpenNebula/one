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
/* eslint-disable react/prop-types */
import {
  GlobalLabel,
  GroupsTable,
  GroupTabs,
  MultipleTags,
  ResourcesBackButton,
  SubmitButton,
  Tr,
  TranslateProvider,
} from '@ComponentsModule'
import { Group, RESOURCE_NAMES, SERVER_CONFIG, T } from '@ConstantsModule'
import { GroupAPI, useAuth, useGeneral, useGeneralApi } from '@FeaturesModule'
import { Chip, Stack } from '@mui/material'
import {
  Cancel,
  Collapse,
  Expand,
  NavArrowLeft,
  RefreshDouble,
} from 'iconoir-react'
import { Row } from 'opennebula-react-table'
import PropTypes from 'prop-types'
import { memo, ReactElement, useEffect, useState } from 'react'

/**
 * Displays a list of Groups with a split pane between the list and selected row(s).
 *
 * @returns {ReactElement} Groups list and selected row(s)
 */
export function Groups() {
  const [selectedRows, setSelectedRows] = useState(() => [])
  const actions = GroupsTable.Actions({ selectedRows, setSelectedRows })
  const { zone } = useGeneral()

  return (
    <TranslateProvider>
      <ResourcesBackButton
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        useUpdateMutation={GroupAPI.useUpdateGroupMutation}
        zone={zone}
        actions={actions}
        table={(props) => (
          <GroupsTable.Table
            onSelectedRowsChange={props.setSelectedRows}
            globalActions={props.actions}
            onRowClick={props.resourcesBackButtonClick}
            useUpdateMutation={props.useUpdateMutation}
            zoneId={props.zone}
            initialState={{
              selectedRowIds: props.selectedRowsTable,
            }}
          />
        )}
        simpleGroupsTags={(props) => (
          <GroupedTags
            tags={props.selectedRows}
            handleElement={props.handleElement}
            onDelete={props.handleUnselectRow}
          />
        )}
        info={(props) => {
          const propsInfo = {
            group: props?.selectedRows?.[0]?.original,
            selectedRows: props?.selectedRows,
          }
          props?.gotoPage && (propsInfo.gotoPage = props.gotoPage)
          props?.unselect && (propsInfo.unselect = props.unselect)

          return <InfoTabs {...propsInfo} />
        }}
      />
    </TranslateProvider>
  )
}

/**
 * Displays details of a Group.
 *
 * @param {Group} group - Group to display
 * @param {Function} [gotoPage] - Function to navigate to a page of a Group
 * @param {Function} [unselect] - Function to unselect a Group
 * @param {object[]} [selectedRows] - Selected rows (for Labels)
 * @returns {ReactElement} Group details
 */
const InfoTabs = memo(({ group, gotoPage, unselect, selectedRows }) => {
  const [get, { data: lazyData, isFetching }] = GroupAPI.useLazyGetGroupQuery()
  const id = group?.ID ?? lazyData?.ID

  const { settings: { FIREEDGE: fireedge = {} } = {} } = useAuth()
  const { FULL_SCREEN_INFO } = fireedge
  const { fullViewMode } = SERVER_CONFIG
  const fullModeDefault =
    FULL_SCREEN_INFO !== undefined ? FULL_SCREEN_INFO === 'true' : fullViewMode
  const { isFullMode } = useGeneral()
  const { setFullMode } = useGeneralApi()

  useEffect(() => {
    !isFullMode && gotoPage()
  }, [])

  return (
    <Stack overflow="auto">
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
        mx={1}
        mb={1}
      >
        <Stack direction="row">
          {fullModeDefault && (
            <SubmitButton
              data-cy="detail-back"
              icon={<NavArrowLeft />}
              tooltip={Tr(T.Back)}
              isSubmitting={isFetching}
              onClick={() => unselect()}
            />
          )}
        </Stack>

        <Stack direction="row" alignItems="center" gap={1} mx={1} mb={1}>
          {fullModeDefault && (
            <GlobalLabel
              selectedRows={selectedRows}
              type={RESOURCE_NAMES?.GROUP}
            />
          )}
          {!fullModeDefault && (
            <SubmitButton
              data-cy="detail-full-mode"
              icon={isFullMode ? <Collapse /> : <Expand />}
              tooltip={Tr(T.FullScreen)}
              isSubmitting={isFetching}
              onClick={() => {
                setFullMode(!isFullMode)
              }}
            />
          )}
          <SubmitButton
            data-cy="detail-refresh"
            icon={<RefreshDouble />}
            tooltip={Tr(T.Refresh)}
            isSubmitting={isFetching}
            onClick={() => get({ id })}
          />
          {typeof unselect === 'function' && (
            <SubmitButton
              data-cy="unselect"
              icon={<Cancel />}
              tooltip={Tr(T.Close)}
              onClick={() => unselect()}
            />
          )}
        </Stack>
      </Stack>
      <GroupTabs id={id} />
    </Stack>
  )
})

InfoTabs.propTypes = {
  group: PropTypes.object.isRequired,
  gotoPage: PropTypes.func,
  unselect: PropTypes.func,
}

InfoTabs.displayName = 'InfoTabs'

/**
 * Displays a list of tags that represent the selected rows.
 *
 * @param {Row[]} tags - Row(s) to display as tags
 * @returns {ReactElement} List of tags
 */
const GroupedTags = ({
  tags = [],
  handleElement = true,
  onDelete = () => undefined,
}) => (
  <Stack direction="row" flexWrap="wrap" gap={1} alignContent="flex-start">
    <MultipleTags
      limitTags={10}
      tags={tags?.map((props) => {
        const { original, id, toggleRowSelected, gotoPage } = props
        const clickElement = handleElement
          ? {
              onClick: gotoPage,
              onDelete: () => onDelete(id) || toggleRowSelected(false),
            }
          : {}

        return <Chip key={id} label={original?.NAME ?? id} {...clickElement} />
      })}
    />
  </Stack>
)

GroupedTags.propTypes = {
  tags: PropTypes.array,
  handleElement: PropTypes.bool,
  onDelete: PropTypes.func,
}
GroupedTags.displayName = 'GroupedTags'
