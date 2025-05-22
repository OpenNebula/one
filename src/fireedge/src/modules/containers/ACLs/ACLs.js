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
  ACLsTable,
  MultipleTags,
  ResourcesBackButton,
  TranslateProvider,
} from '@ComponentsModule'
import { useGeneral } from '@FeaturesModule'
import { Chip, Stack } from '@mui/material'
import { Row } from 'opennebula-react-table'
import PropTypes from 'prop-types'
import { ReactElement, useState } from 'react'

/**
 * Displays a list of Groups with a split pane between the list and selected row(s).
 *
 * @returns {ReactElement} Groups list and selected row(s)
 */
export function ACLs() {
  const [selectedRows, setSelectedRows] = useState(() => [])
  const { zone } = useGeneral()
  const actions = ACLsTable.Actions({ selectedRows, setSelectedRows })

  return (
    <TranslateProvider>
      <ResourcesBackButton
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        zone={zone}
        actions={actions}
        table={(props) => (
          <ACLsTable.Table
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
    </TranslateProvider>
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
