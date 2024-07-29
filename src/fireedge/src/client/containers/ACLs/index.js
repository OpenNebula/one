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
import { Chip, Stack } from '@mui/material'
import MultipleTags from 'client/components/MultipleTags'
import ResourcesBackButton from 'client/components/ResourcesBackButton'
import { ACLsTable } from 'client/components/Tables'
import ACLActions from 'client/components/Tables/ACLs/actions'
import { useGeneral } from 'client/features/General'
import PropTypes from 'prop-types'
import { ReactElement, useState } from 'react'
import { Row } from 'react-table'

/**
 * Displays a list of Groups with a split pane between the list and selected row(s).
 *
 * @returns {ReactElement} Groups list and selected row(s)
 */
function ACLs() {
  const [selectedRows, setSelectedRows] = useState(() => [])
  const { zone } = useGeneral()
  const actions = ACLActions()

  return (
    <ResourcesBackButton
      selectedRows={selectedRows}
      setSelectedRows={setSelectedRows}
      zone={zone}
      actions={actions}
      table={(props) => (
        <ACLsTable
          onSelectedRowsChange={props.setSelectedRows}
          globalActions={props.actions}
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
      info={(props) => (
        <GroupedTags
          tags={props.selectedRows}
          handleElement={props.handleElement}
          onDelete={props.handleUnselectRow}
        />
      )}
    />
  )
}

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

export default ACLs
