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
import PropTypes from 'prop-types'
import { ReactElement } from 'react'
import { Stack } from '@mui/material'
import SettingsIcon from 'iconoir-react/dist/LabelOutline'
import { UseFiltersInstanceProps } from 'opennebula-react-table'
import { T, STYLE_BUTTONS } from '@ConstantsModule'
import { Translate } from '@modules/components/HOC'
import HeaderPopover from '@modules/components/Header/Popover'
import NestedLabelTree from '@modules/components/List/NestedLabelTree'

/**
 * Button to filter rows by label or assign labels to selected rows.
 *
 * @param {UseFiltersInstanceProps} props - Component props
 * @param {object[]} props.selectedRows - Selected rows
 * @returns {ReactElement} Button component
 */
const GlobalLabel = ({
  selectedRows = [],
  type,
  filters,
  setFilter,
  resetFilter,
}) => (
  <Stack direction="row" gap="0.5em" flexWrap="wrap">
    <HeaderPopover
      key={'label-popover'}
      id="filter-by-label"
      icon={<SettingsIcon />}
      headerTitle={<Translate word={T.Labels} />}
      buttonLabel={<Translate word={T.Label} />}
      buttonProps={{
        'data-cy': 'filter-by-label',
        importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
        size: STYLE_BUTTONS.SIZE.MEDIUM,
        type: STYLE_BUTTONS.TYPE.FILLED,
        variant: 'outlined',
        color: 'secondary',
      }}
      popperProps={{
        placement: 'bottom-end',
        sx: {
          width: { md: 620 },
          maxHeight: '600px',
          overflowY: 'auto',
        },
      }}
    >
      {({ handleClose }) => (
        <NestedLabelTree
          selectedRows={selectedRows}
          resourceType={type}
          filters={filters}
          setFilter={setFilter}
          resetFilter={resetFilter}
          closeParent={handleClose}
        />
      )}
    </HeaderPopover>
  </Stack>
)

GlobalLabel.propTypes = {
  selectedRows: PropTypes.array,
  useUpdateMutation: PropTypes.func,
  type: PropTypes.string,
  filters: PropTypes.array,
  setFilter: PropTypes.func,
  resetFilter: PropTypes.func,
}

GlobalLabel.displayName = 'GlobalLabel'

export const LABEL_COLUMN_ID = 'label'
export default GlobalLabel
