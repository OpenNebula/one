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
  DatastoresTable,
  DatastoreTabs,
  MultipleTags,
  ResourcesBackButton,
  SubmitButton,
  Tr,
  TranslateProvider,
} from '@ComponentsModule'
import { Datastore, T } from '@ConstantsModule'
import { DatastoreAPI, useGeneral } from '@FeaturesModule'
import { Chip, Stack, Typography } from '@mui/material'
import Cancel from 'iconoir-react/dist/Cancel'
import GotoIcon from 'iconoir-react/dist/Pin'
import RefreshDouble from 'iconoir-react/dist/RefreshDouble'
import { Row } from 'opennebula-react-table'
import PropTypes from 'prop-types'
import { memo, ReactElement, useState } from 'react'

/**
 * Displays a list of Datastores with a split pane between the list and selected row(s).
 *
 * @returns {ReactElement} Datastores list and selected row(s)
 */
export function Datastores() {
  const [selectedRows, setSelectedRows] = useState(() => [])
  const actions = DatastoresTable.Actions()
  const { zone } = useGeneral()

  return (
    <TranslateProvider>
      <ResourcesBackButton
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        useUpdateMutation={DatastoreAPI.useUpdateDatastoreMutation}
        zone={zone}
        actions={actions}
        table={(props) => (
          <DatastoresTable.Table
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
            datastore: props?.selectedRows?.[0]?.original,
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
 * Displays details of a Datastore.
 *
 * @param {Datastore} datastore - Datastore to display
 * @param {Function} [gotoPage] - Function to navigate to a page of a Datastore
 * @param {Function} [unselect] - Function to unselect a Datastore
 * @returns {ReactElement} Datastore details
 */
const InfoTabs = memo(({ datastore, gotoPage, unselect }) => {
  const [getDatastore, { data: lazyData, isFetching }] =
    DatastoreAPI.useLazyGetDatastoreQuery()
  const id = datastore?.ID ?? lazyData?.ID
  const name = datastore?.NAME ?? lazyData?.NAME

  return (
    <Stack overflow="auto">
      <Stack direction="row" alignItems="center" gap={1} mx={1} mb={1}>
        <Typography color="text.primary" noWrap flexGrow={1}>
          {`#${id} | ${name}`}
        </Typography>
        <SubmitButton
          data-cy="detail-refresh"
          icon={<RefreshDouble />}
          tooltip={Tr(T.Refresh)}
          isSubmitting={isFetching}
          onClick={() => getDatastore({ id })}
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
      </Stack>
      <DatastoreTabs id={id} />
    </Stack>
  )
})

InfoTabs.propTypes = {
  datastore: PropTypes.object.isRequired,
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
