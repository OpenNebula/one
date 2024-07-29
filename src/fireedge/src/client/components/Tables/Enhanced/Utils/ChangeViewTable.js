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
import { memo } from 'react'
import PropTypes from 'prop-types'

import { EyeAlt } from 'iconoir-react'
import { MenuItem, MenuList, Stack } from '@mui/material'

import HeaderPopover from 'client/components/Header/Popover'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

/**
 * Render all selected sorters.
 *
 * @returns {object} Component JSX
 */
const ChangeViewTable = memo(({ tableViews = {} }) => {
  // Set click action
  const handleClick = (name) => {
    tableViews.onClick(name)
  }

  // Get view types
  const typeViews = Object.entries(tableViews.views)

  return (
    <Stack direction="row" gap="0.5em" flexWrap="wrap">
      <HeaderPopover
        id="changeviewtable-by-button"
        icon={<EyeAlt />}
        headerTitle={Tr(T['acls.table.types.title'])}
        buttonLabel={Tr(T['acls.table.types.button'])}
        buttonProps={{
          'data-cy': 'changeviewtable-by-button',
          disableElevation: true,
          variant: 'outlined',
          color: 'secondary',
        }}
        popperProps={{ placement: 'bottom-end' }}
      >
        {() => (
          <MenuList data-cy="change-view-list">
            {typeViews.map(([key, value]) => (
              <MenuItem
                key={key}
                onClick={() => handleClick(value.type)}
                data-cy={key}
              >
                {Tr(value.name)}
              </MenuItem>
            ))}
          </MenuList>
        )}
      </HeaderPopover>
    </Stack>
  )
})

ChangeViewTable.propTypes = {
  preFilteredRows: PropTypes.array,
  state: PropTypes.object,
  tableViews: PropTypes.object,
}

ChangeViewTable.displayName = 'ChangeViewTable'

export default ChangeViewTable
