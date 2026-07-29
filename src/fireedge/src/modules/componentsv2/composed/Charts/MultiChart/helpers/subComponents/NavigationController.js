/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { useState } from 'react'
import { Checkbox, ListItemText, Menu, MenuItem } from '@mui/material'
import { Filter, NavArrowLeft, NavArrowRight } from 'iconoir-react'

import { ButtonGroup } from '@modules/componentsv2/primitives/Buttons/Group'

/**
 * NavigationController component for navigating through items and filtering them.
 *
 * @param {object} props - Props
 * @param {Function} props.onPrev - Callback function when the previous button is clicked.
 * @param {Function} props.onNext - Callback function when the next button is clicked.
 * @param {boolean} props.isPrevDisabled - Determines if the previous button is disabled.
 * @param {boolean} props.isNextDisabled - Determines if the next button is disabled.
 * @param {Array} props.selectedItems - List of currently selected items.
 * @param {Array} props.items - List of all available items.
 * @param {Function} props.setSelectedItems - Callback function to set the selected items.
 * @param {boolean} props.isFilterDisabled - Determines if the filter is disabled.
 * @param {boolean} props.isPaginationDisabled - Determines if the pagination is disabled.
 * @returns {object} NavigationController component.
 */
export const NavigationController = ({
  onPrev,
  onNext,
  isPrevDisabled,
  isNextDisabled,
  selectedItems,
  items,
  setSelectedItems,
  isFilterDisabled,
  isPaginationDisabled,
}) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const isFilterOpen = Boolean(anchorEl)

  const handleOpenFilter = (event) => {
    if (isFilterDisabled) return
    setAnchorEl(event.currentTarget)
  }

  const handleCloseFilter = () => setAnchorEl(null)

  const handleToggleItem = (item) => () => {
    const nextItems = selectedItems.includes(item)
      ? selectedItems.filter((selectedItem) => selectedItem !== item)
      : [...selectedItems, item]

    setSelectedItems(nextItems)
  }

  return (
    <>
      <ButtonGroup
        selected={new Set()}
        buttons={[
          {
            startIcon: <Filter width="16px" height="16px" />,
            onClick: handleOpenFilter,
            value: 'filter',
            isDisabled: isFilterDisabled,
          },
          {
            startIcon: <NavArrowLeft width="16px" height="16px" />,
            onClick: () => onPrev(),
            value: 'previous',
            isDisabled: isPrevDisabled || isPaginationDisabled,
          },
          {
            startIcon: <NavArrowRight width="16px" height="16px" />,
            onClick: () => onNext(),
            value: 'next',
            isDisabled: isNextDisabled || isPaginationDisabled,
          },
        ]}
      />
      <Menu anchorEl={anchorEl} open={isFilterOpen} onClose={handleCloseFilter}>
        {items.map((item) => (
          <MenuItem key={item} value={item} onClick={handleToggleItem(item)}>
            <Checkbox checked={selectedItems.includes(item)} />
            <ListItemText primary={item} />
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

NavigationController.propTypes = {
  onPrev: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  isPrevDisabled: PropTypes.bool.isRequired,
  isNextDisabled: PropTypes.bool.isRequired,
  selectedItems: PropTypes.array.isRequired,
  items: PropTypes.array,
  setSelectedItems: PropTypes.func.isRequired,
  isFilterDisabled: PropTypes.bool.isRequired,
  isPaginationDisabled: PropTypes.bool.isRequired,
}

NavigationController.defaultProps = {
  items: [],
}
