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
import { Typography, Box, Stack, Chip } from '@mui/material'
import { Row } from 'react-table'

import { VNetworkTemplatesTable } from 'client/components/Tables'
import VNetworkTemplateTabs from 'client/components/Tabs/VNetworkTemplate'
import SplitPane from 'client/components/SplitPane'
import MultipleTags from 'client/components/MultipleTags'

/**
 * Displays a list of VNet Templates with a split pane between the list and selected row(s).
 *
 * @returns {ReactElement} VNet Templates list and selected row(s)
 */
function VNetworkTemplates() {
  const [selectedRows, onSelectedRowsChange] = useState(() => [])

  const hasSelectedRows = selectedRows?.length > 0
  const moreThanOneSelected = selectedRows?.length > 1
  const gridTemplateRows = hasSelectedRows ? '1fr auto 1fr' : '1fr'

  return (
    <SplitPane gridTemplateRows={gridTemplateRows}>
      {({ getGridProps, GutterComponent }) => (
        <Box {...getGridProps()}>
          <VNetworkTemplatesTable onSelectedRowsChange={onSelectedRowsChange} />

          {hasSelectedRows && (
            <>
              <GutterComponent direction="row" track={1} />
              {moreThanOneSelected ? (
                <GroupedTags tags={selectedRows} />
              ) : (
                <InfoTabs vnTemplate={selectedRows[0]?.original} />
              )}
            </>
          )}
        </Box>
      )}
    </SplitPane>
  )
}

/**
 * Displays details of a VNet Template.
 *
 * @param {object} vnTemplate - VNet Template to display
 * @returns {ReactElement} VNet Template details
 */
const InfoTabs = memo(({ vnTemplate }) => (
  <Stack overflow="auto" data-cy="detail">
    <Typography color="text.primary" noWrap mb={1}>
      {`#${vnTemplate.ID} | ${vnTemplate.NAME}`}
    </Typography>
    <VNetworkTemplateTabs id={vnTemplate.ID} />
  </Stack>
))

InfoTabs.propTypes = { vnTemplate: PropTypes.object.isRequired }
InfoTabs.displayName = 'InfoTabs'

/**
 * Displays a list of tags that represent the selected rows.
 *
 * @param {Row[]} tags - Row(s) to display as tags
 * @returns {ReactElement} List of tags
 */
const GroupedTags = memo(({ tags = [] }) => (
  <Stack direction="row" flexWrap="wrap" gap={1}>
    <MultipleTags
      limitTags={10}
      tags={tags?.map(({ original, id, toggleRowSelected }) => (
        <Chip
          key={id}
          label={original?.NAME ?? id}
          onDelete={() => toggleRowSelected(false)}
        />
      ))}
    />
  </Stack>
))

GroupedTags.propTypes = { tags: PropTypes.array }
GroupedTags.displayName = 'GroupedTags'

export default VNetworkTemplates
