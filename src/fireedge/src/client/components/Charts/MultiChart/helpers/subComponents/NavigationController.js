/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import React from 'react'
import PropTypes from 'prop-types'
import { NavArrowRight, NavArrowLeft, Filter } from 'iconoir-react'
import {
  Box,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
} from '@mui/material'

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
 * @param {object} props.styles - Custom styles for the component.
 * @returns {React.Component} NavigationController component.
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
  styles,
}) => (
  <Box sx={{ ...styles.container, display: 'inline-flex' }}>
    <BoxedIcon disabled={isFilterDisabled}>
      <FormControl size="small" sx={styles.formControl}>
        <Select
          multiple
          value={selectedItems}
          onChange={(event) => setSelectedItems(event.target.value)}
          IconComponent={Filter}
          sx={styles.select}
          renderValue={(selected) => ''}
          disabled={isFilterDisabled}
        >
          {items.map((item) => (
            <MenuItem key={item} value={item}>
              <Checkbox checked={selectedItems.includes(item)} />
              <ListItemText primary={item} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </BoxedIcon>

    <Box sx={styles.divider} />

    <BoxedIcon
      onClick={onPrev}
      disabled={isPrevDisabled || isPaginationDisabled}
    >
      <NavArrowLeft />
    </BoxedIcon>

    <Box sx={styles.divider} />

    <BoxedIcon
      onClick={onNext}
      disabled={isNextDisabled || isPaginationDisabled}
    >
      <NavArrowRight />
    </BoxedIcon>
  </Box>
)

const BoxedIcon = ({ children, ...props }) => (
  <Box
    component={IconButton}
    sx={{
      width: 40,
      height: 40,
      display: 'flex',
      alignItems: 'center',
      border: 'none',
      padding: 0,
      justifyContent: 'center',
      '&.Mui-focusVisible': {
        outline: 'none',
        boxShadow: 'none',
      },
      '&:hover': {
        backgroundColor: 'transparent',
      },
    }}
    {...props}
  >
    {children}
  </Box>
)

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
  styles: PropTypes.object,
}

BoxedIcon.propTypes = {
  children: PropTypes.node.isRequired,
}

NavigationController.defaultProps = {
  styles: {
    container: {
      display: 'flex',
      alignItems: 'center',
      border: 'none',
      borderBottom: 'none',
      borderRadius: '2px 2px 0 0',
    },
    formControl: {
      minWidth: 40,
      '& .MuiOutlinedInput-notchedOutline': {
        border: 'none',
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        border: 'none',
      },
    },
    select: {
      borderRadius: 0,
      paddingRight: 0,
      border: 'none',
    },
    divider: {
      width: 1,
      height: '100%',
    },
  },
  items: [],
}
