/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement, useState, memo } from 'react'
import PropTypes from 'prop-types'
import { Pin as GotoIcon, RefreshDouble, Cancel } from 'iconoir-react'
import { Typography, Box, Stack, Chip } from '@mui/material'
import { Row } from 'react-table'

import { useLazyGetTemplateQuery } from 'client/features/OneApi/vmTemplate'
import { VmTemplatesTable } from 'client/components/Tables'
import VmTemplateActions from 'client/components/Tables/VmTemplates/actions'
import VmTemplateTabs from 'client/components/Tabs/VmTemplate'
import SplitPane from 'client/components/SplitPane'
import MultipleTags from 'client/components/MultipleTags'
import { SubmitButton } from 'client/components/FormControl'
import { Tr } from 'client/components/HOC'
import { T, VmTemplate } from 'client/constants'

/**
 * Displays a list of VM Templates with a split pane between the list and selected row(s).
 *
 * @returns {ReactElement} VM Templates list and selected row(s)
 */
function VmTemplates() {
  const [selectedRows, onSelectedRowsChange] = useState(() => [])
  const actions = VmTemplateActions()

  const hasSelectedRows = selectedRows?.length > 0
  const moreThanOneSelected = selectedRows?.length > 1

  return (
    <SplitPane gridTemplateRows="1fr auto 1fr">
      {({ getGridProps, GutterComponent }) => (
        <Box {...(hasSelectedRows && getGridProps())}>
          <VmTemplatesTable
            onSelectedRowsChange={onSelectedRowsChange}
            globalActions={actions}
          />

          {hasSelectedRows && (
            <>
              <GutterComponent direction="row" track={1} />
              {moreThanOneSelected ? (
                <GroupedTags tags={selectedRows} />
              ) : (
                <InfoTabs
                  template={selectedRows[0]?.original}
                  gotoPage={selectedRows[0]?.gotoPage}
                  unselect={() => selectedRows[0]?.toggleRowSelected(false)}
                />
              )}
            </>
          )}
        </Box>
      )}
    </SplitPane>
  )
}

/**
 * Displays details of a VM Template.
 *
 * @param {VmTemplate} template - VM Template id to display
 * @param {Function} [gotoPage] - Function to navigate to a page of a VM Template
 * @param {Function} [unselect] - Function to unselect a VM Template
 * @returns {ReactElement} VM Template details
 */
const InfoTabs = memo(({ template, gotoPage, unselect }) => {
  const [getTemplate, { isFetching }] = useLazyGetTemplateQuery()

  return (
    <Stack overflow="auto">
      <Stack direction="row" alignItems="center" gap={1} mb={1}>
        <SubmitButton
          data-cy="detail-refresh"
          icon={<RefreshDouble />}
          tooltip={Tr(T.Refresh)}
          isSubmitting={isFetching}
          onClick={() => getTemplate({ id: template?.ID })}
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
        <Typography color="text.primary" noWrap>
          {`#${template?.ID} | ${template?.NAME}`}
        </Typography>
      </Stack>
      <VmTemplateTabs id={template?.ID} />
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
const GroupedTags = memo(({ tags = [] }) => (
  <Stack direction="row" flexWrap="wrap" gap={1} alignContent="flex-start">
    <MultipleTags
      limitTags={10}
      tags={tags?.map(({ original, id, toggleRowSelected, gotoPage }) => (
        <Chip
          key={id}
          label={original?.NAME ?? id}
          onClick={gotoPage}
          onDelete={() => toggleRowSelected(false)}
        />
      ))}
    />
  </Stack>
))

GroupedTags.propTypes = { tags: PropTypes.array }
GroupedTags.displayName = 'GroupedTags'

export default VmTemplates
