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
import { Chip, Stack, Typography } from '@mui/material'
import { Cancel, Pin as GotoIcon, RefreshDouble } from 'iconoir-react'
import PropTypes from 'prop-types'
import { ReactElement, memo, useState } from 'react'
import { Row } from 'react-table'

import { SubmitButton } from 'client/components/FormControl'
import { Tr } from 'client/components/HOC'
import MultipleTags from 'client/components/MultipleTags'
import ResourcesBackButton from 'client/components/ResourcesBackButton'
import { VDCsTable } from 'client/components/Tables'
import VDCActions from 'client/components/Tables/VirtualDataCenters/actions'
import VDCTabs from 'client/components/Tabs/Vdc'
import { T, VmTemplate as VdcTemplate } from 'client/constants'
import { useGeneral } from 'client/features/General'
import {
  useLazyGetVDCQuery,
  useUpdateVDCMutation,
} from 'client/features/OneApi/vdc'

/**
 * Displays a list of VDCs with a split pane between the list and selected row(s).
 *
 * @returns {ReactElement} VDCs list and selected row(s)
 */
function VirtualDataCenters() {
  const [selectedRows, setSelectedRows] = useState(() => [])
  const actions = VDCActions()
  const { zone } = useGeneral()

  return (
    <ResourcesBackButton
      selectedRows={selectedRows}
      setSelectedRows={setSelectedRows}
      useUpdateMutation={useUpdateVDCMutation}
      zone={zone}
      actions={actions}
      table={(props) => (
        <VDCsTable
          onSelectedRowsChange={props.setSelectedRows}
          globalActions={props.actions}
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
          template: props?.selectedRows?.[0]?.original,
          selectedRows: props?.selectedRows,
        }
        props?.gotoPage && (propsInfo.gotoPage = props.gotoPage)
        props?.unselect && (propsInfo.unselect = props.unselect)

        return <InfoTabs {...propsInfo} />
      }}
    />
  )
}

/**
 * Displays details of a VDC Template.
 *
 * @param {VdcTemplate} template - VDC Template id to display
 * @param {Function} [gotoPage] - Function to navigate to a page of a VDC Template
 * @param {Function} [unselect] - Function to unselect a VDC Template
 * @returns {ReactElement} VDC Template details
 */
const InfoTabs = memo(({ template, gotoPage, unselect }) => {
  const [getVDC, { data, isFetching }] = useLazyGetVDCQuery()
  const id = template?.ID ?? data?.ID
  const name = template?.NAME ?? data?.NAME

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
          onClick={() => getVDC({ id })}
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
      <VDCTabs id={id} />
    </Stack>
  )
})

InfoTabs.propTypes = {
  template: PropTypes.object,
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

export default VirtualDataCenters
