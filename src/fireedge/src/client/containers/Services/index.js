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
import { BookmarkEmpty } from 'iconoir-react'
import { Typography, Box, Stack, Chip, IconButton } from '@mui/material'
import { Row } from 'react-table'

import serviceApi from 'client/features/OneApi/service'
import { ServicesTable } from 'client/components/Tables'
import ServiceTabs from 'client/components/Tabs/Service'
import SplitPane from 'client/components/SplitPane'
import MultipleTags from 'client/components/MultipleTags'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

/**
 * Displays a list of Service with a split pane between
 * the list and selected row(s).
 *
 * @returns {ReactElement} Service list and selected row(s)
 */
function Services() {
  const [selectedRows, onSelectedRowsChange] = useState(() => [])

  const hasSelectedRows = selectedRows?.length > 0
  const moreThanOneSelected = selectedRows?.length > 1
  const gridTemplateRows = hasSelectedRows ? '1fr auto 1fr' : '1fr'

  return (
    <SplitPane gridTemplateRows={gridTemplateRows}>
      {({ getGridProps, GutterComponent }) => (
        <Box {...getGridProps()}>
          <ServicesTable onSelectedRowsChange={onSelectedRowsChange} />

          {hasSelectedRows && (
            <>
              <GutterComponent direction="row" track={1} />
              {moreThanOneSelected ? (
                <GroupedTags tags={selectedRows} />
              ) : (
                <InfoTabs
                  id={selectedRows[0]?.original?.ID}
                  gotoPage={selectedRows[0]?.gotoPage}
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
 * Displays details of a Service.
 *
 * @param {string} id - Service id to display
 * @param {Function} [gotoPage] - Function to navigate to a page of a Service
 * @returns {ReactElement} Service details
 */
const InfoTabs = memo(({ id, gotoPage }) => {
  const template = serviceApi.endpoints.getServices.useQueryState(undefined, {
    selectFromResult: ({ data = [] }) => data.find((item) => +item.ID === +id),
  })

  return (
    <Stack overflow="auto">
      <Stack direction="row" alignItems="center" gap={1} mb={1}>
        <Typography color="text.primary" noWrap>
          {`#${id} | ${template.NAME}`}
        </Typography>
        {gotoPage && (
          <IconButton title={Tr(T.LocateOnTable)} onClick={gotoPage}>
            <BookmarkEmpty />
          </IconButton>
        )}
      </Stack>
      <ServiceTabs id={id} />
    </Stack>
  )
})

InfoTabs.propTypes = {
  id: PropTypes.string.isRequired,
  gotoPage: PropTypes.func,
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

export default Services
