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
/* eslint-disable react/prop-types */
import {
  HostsTable,
  HostTabs,
  MultipleTags,
  ResourcesBackButton,
  SubmitButton,
  Tr,
  TranslateProvider,
} from '@ComponentsModule'
import { Host, T } from '@ConstantsModule'
import { HostAPI, useGeneral } from '@FeaturesModule'
import { Chip, Stack, Typography } from '@mui/material'
import { MuiProvider, SunstoneTheme } from '@ProvidersModule'
import Cancel from 'iconoir-react/dist/Cancel'
import GotoIcon from 'iconoir-react/dist/Pin'
import RefreshDouble from 'iconoir-react/dist/RefreshDouble'
import { Row } from 'opennebula-react-table'
import PropTypes from 'prop-types'
import { memo, ReactElement, useState } from 'react'

/**
 * Displays a list of Hosts with a split pane between the list and selected row(s).
 *
 * @returns {ReactElement} Hosts list and selected row(s)
 */
export function Hosts() {
  const [selectedRows, setSelectedRows] = useState(() => [])
  const actions = HostsTable.Actions()
  const { zone } = useGeneral()

  return (
    <MuiProvider theme={SunstoneTheme}>
      <TranslateProvider>
        <ResourcesBackButton
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
          useUpdateMutation={HostAPI.useUpdateHostMutation}
          zone={zone}
          actions={actions}
          table={(props) => (
            <HostsTable.Table
              onSelectedRowsChange={props.setSelectedRows}
              globalActions={props.actions}
              useUpdateMutation={props.useUpdateMutation}
              onRowClick={props.resourcesBackButtonClick}
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
              host: props?.selectedRows?.[0]?.original,
              selectedRows: props?.selectedRows,
            }
            props?.gotoPage && (propsInfo.gotoPage = props.gotoPage)
            props?.unselect && (propsInfo.unselect = props.unselect)

            return <InfoTabs {...propsInfo} />
          }}
        />
      </TranslateProvider>
    </MuiProvider>
  )
}

/**
 * Displays details of a Host.
 *
 * @param {Host} host - Host to display
 * @param {Function} [gotoPage] - Function to navigate to a page of a Host
 * @param {Function} [unselect] - Function to unselect a Host
 * @returns {ReactElement} Host details
 */
const InfoTabs = memo(({ host, gotoPage, unselect }) => {
  const [getVm, { data: lazyData, isFetching }] = HostAPI.useLazyGetHostQuery()
  const id = host?.ID ?? lazyData?.ID
  const name = host?.NAME ?? lazyData?.NAME

  return (
    <Stack overflow="auto">
      <Stack direction="row" alignItems="center" gap={1} mx={1} mb={1}>
        <Typography color="text.primary" noWrap flexGrow={1}>
          {`#${id} | ${name}`}
        </Typography>

        {/* -- ACTIONS -- */}
        <SubmitButton
          data-cy="detail-refresh"
          icon={<RefreshDouble />}
          tooltip={Tr(T.Refresh)}
          isSubmitting={isFetching}
          onClick={() => getVm({ id })}
        />
        {typeof gotoPage === 'function' && (
          <SubmitButton
            data-cy="locate-on-table"
            icon={<GotoIcon />}
            tooltip={Tr(T.LocateOnTable)}
            onClick={() => gotoPage()}
          />
        )}
        {typeof unselect === 'function' && (
          <SubmitButton
            data-cy="unselect"
            icon={<Cancel />}
            tooltip={Tr(T.Close)}
            onClick={() => unselect()}
          />
        )}
        {/* -- END ACTIONS -- */}
      </Stack>
      <HostTabs id={id} />
    </Stack>
  )
})

InfoTabs.propTypes = {
  host: PropTypes.object,
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
