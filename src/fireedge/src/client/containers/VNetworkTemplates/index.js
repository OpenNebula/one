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
import Cancel from 'iconoir-react/dist/Cancel'
import GotoIcon from 'iconoir-react/dist/Pin'
import RefreshDouble from 'iconoir-react/dist/RefreshDouble'
import PropTypes from 'prop-types'
import { ReactElement, memo, useState } from 'react'
import { Row } from 'react-table'

import { SubmitButton } from 'client/components/FormControl'
import { Tr } from 'client/components/HOC'
import MultipleTags from 'client/components/MultipleTags'
import ResourcesBackButton from 'client/components/ResourcesBackButton'
import { VNetworkTemplatesTable } from 'client/components/Tables'
import VNetworkTemplateActions from 'client/components/Tables/VNetworkTemplates/actions'
import VNetworkTemplateTabs from 'client/components/Tabs/VNetworkTemplate'
import { T, VNetworkTemplate } from 'client/constants'
import { useGeneral } from 'client/features/General'
import {
  useLazyGetVNTemplateQuery,
  useUpdateVNTemplateMutation,
} from 'client/features/OneApi/networkTemplate'

/**
 * Displays a list of VNet Templates with a split pane between the list and selected row(s).
 *
 * @returns {ReactElement} VNet Templates list and selected row(s)
 */
function VNetworkTemplates() {
  const [selectedRows, setSelectedRows] = useState(() => [])
  const actions = VNetworkTemplateActions()
  const { zone } = useGeneral()

  return (
    <ResourcesBackButton
      selectedRows={selectedRows}
      setSelectedRows={setSelectedRows}
      useUpdateMutation={useUpdateVNTemplateMutation}
      zone={zone}
      actions={actions}
      table={(props) => (
        <VNetworkTemplatesTable
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
          vnTemplate: props?.selectedRows?.[0]?.original,
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
 * Displays details of a VNet Template.
 *
 * @param {VNetworkTemplate} vnTemplate - VNet Template to display
 * @param {Function} [gotoPage] - Function to navigate to a page of a VNet Template
 * @param {Function} [unselect] - Function to unselect
 * @returns {ReactElement} VNet Template details
 */
const InfoTabs = memo(({ vnTemplate, gotoPage, unselect }) => {
  const [get, { data: lazyData, isFetching }] = useLazyGetVNTemplateQuery()
  const id = vnTemplate?.ID ?? lazyData?.ID
  const name = vnTemplate?.NAME ?? lazyData?.NAME

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
          onClick={() => get({ id })}
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
      <VNetworkTemplateTabs id={id} />
    </Stack>
  )
})

InfoTabs.propTypes = {
  vnTemplate: PropTypes.object,
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

export default VNetworkTemplates
