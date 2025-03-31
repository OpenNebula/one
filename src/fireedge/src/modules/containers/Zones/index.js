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
  MultipleTags,
  ResourcesBackButton,
  SubmitButton,
  Tr,
  TranslateProvider,
  ZonesTable,
  ZoneTabs,
} from '@ComponentsModule'
import { T, Zone } from '@ConstantsModule'
import { ZoneAPI, useGeneral, useGeneralApi, useAuth } from '@FeaturesModule'
import { Chip, Stack } from '@mui/material'
import {
  Cancel,
  RefreshDouble,
  Expand,
  Collapse,
  NavArrowLeft,
} from 'iconoir-react'
import { Row } from 'opennebula-react-table'
import PropTypes from 'prop-types'
import { memo, ReactElement, useState, useEffect } from 'react'
const { useLazyGetZoneQuery, useUpdateZoneMutation } = ZoneAPI

/**
 * Displays a list of Zones with a split pane between the list and selected row(s).
 *
 * @returns {ReactElement} Zones list and selected row(s)
 */
export function Zones() {
  const [selectedRows, setSelectedRows] = useState(() => [])

  // Attempting to remove MuiProvider
  return (
    <TranslateProvider>
      <ResourcesBackButton
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        useUpdateMutation={useUpdateZoneMutation}
        table={(props) => (
          <ZonesTable.Table
            onSelectedRowsChange={props.setSelectedRows}
            globalActions={props.actions}
            onRowClick={props.resourcesBackButtonClick}
            useUpdateMutation={props.useUpdateMutation}
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
            zone: props?.selectedRows?.[0]?.original,
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
 * Displays details of a Zone.
 *
 * @param {Zone} zone - Zone to display
 * @param {Function} [gotoPage] - Function to navigate to a page of a Zone
 * @param {Function} [unselect] - Function to unselect
 * @returns {ReactElement} Zone details
 */
const InfoTabs = memo(({ zone, gotoPage, unselect }) => {
  const [get, { data: lazyData, isFetching }] = useLazyGetZoneQuery()
  const id = zone?.ID ?? lazyData?.ID

  const { settings: { FIREEDGE: fireedge = {} } = {} } = useAuth()
  const { FULL_SCREEN_INFO } = fireedge
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
          {FULL_SCREEN_INFO === 'true' && (
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
          {FULL_SCREEN_INFO === 'false' && (
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
      <ZoneTabs id={id} />
    </Stack>
  )
})

InfoTabs.propTypes = {
  zone: PropTypes.object,
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
const GroupedTags = memo(
  ({ tags = [], handleElement = true, onDelete = () => undefined }) => (
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

          return (
            <Chip key={id} label={original?.NAME ?? id} {...clickElement} />
          )
        })}
      />
    </Stack>
  )
)

GroupedTags.propTypes = {
  tags: PropTypes.array,
  handleElement: PropTypes.bool,
  onDelete: PropTypes.func,
}
GroupedTags.displayName = 'GroupedTags'
