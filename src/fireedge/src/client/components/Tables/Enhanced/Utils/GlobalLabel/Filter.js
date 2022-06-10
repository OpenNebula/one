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
import { ReactElement, SyntheticEvent } from 'react'
import PropTypes from 'prop-types'

import CheckIcon from 'iconoir-react/dist/Check'
import CancelIcon from 'iconoir-react/dist/Cancel'
import { styled, Box, InputBase, Typography } from '@mui/material'
import Autocomplete, {
  autocompleteClasses,
  AutocompleteChangeDetails,
  AutocompleteChangeReason,
  AutocompleteCloseReason,
} from '@mui/material/Autocomplete'

import { StatusCircle } from 'client/components/Status'
import { getColorFromString } from 'client/models/Helper'
import { Translate, Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const StyledInput = styled(InputBase)(
  ({ theme: { shape, palette, transitions } }) => ({
    padding: 10,
    width: '100%',
    '& input': {
      padding: 6,
      transition: transitions.create(['border-color', 'box-shadow']),
      border: `1px solid ${palette.divider}`,
      borderRadius: shape.borderRadius / 2,
      fontSize: 14,
      '&:focus': {
        boxShadow: `0px 0px 0px 3px ${palette.secondary[palette.mode]}`,
      },
    },
  })
)

const StyledAutocompletePopper = styled('div')(({ theme }) => ({
  [`& .${autocompleteClasses.paper}`]: {
    boxShadow: 'none',
    margin: 0,
    color: 'inherit',
    fontSize: 13,
  },
  [`& .${autocompleteClasses.listbox}`]: {
    padding: 0,
    [`& .${autocompleteClasses.option}`]: {
      minHeight: 'auto',
      alignItems: 'flex-start',
      padding: 8,
      borderBottom: `1px solid  ${theme.palette.divider}`,
      '&[aria-selected="true"]': {
        backgroundColor: theme.palette.action.hover,
      },
      [`&.${autocompleteClasses.focused}, &.${autocompleteClasses.focused}[aria-selected="true"]`]:
        {
          backgroundColor: theme.palette.action.hover,
        },
    },
  },
  [`&.${autocompleteClasses.popperDisablePortal}`]: {
    position: 'relative',
  },
}))

const PopperComponent = ({ disablePortal, anchorEl, open, ...other }) => (
  <StyledAutocompletePopper {...other} />
)

PopperComponent.propTypes = {
  anchorEl: PropTypes.any,
  disablePortal: PropTypes.bool,
  open: PropTypes.bool,
}

/**
 * AutoComplete to filter rows by label.
 *
 * @param {object} props - Component props
 * @param {string[]} props.currentValue - The current value of the filter
 * @param {function(SyntheticEvent, AutocompleteChangeReason, AutocompleteChangeDetails)} props.handleChange - Handle change event
 * @param {function(SyntheticEvent, AutocompleteCloseReason)} props.handleClose - Handle close event
 * @param {string[]} props.labels - The list of labels to filter
 * @param {string[]} props.filters - The current filters
 * @returns {ReactElement} Filter component
 */
const FilterByLabel = ({
  currentValue = [],
  filters = [],
  labels = [],
  handleChange,
  handleClose,
}) => (
  <Autocomplete
    open
    multiple
    onClose={handleClose}
    value={currentValue}
    onChange={handleChange}
    disableCloseOnSelect
    PopperComponent={PopperComponent}
    renderTags={() => null}
    noOptionsText={<Translate word={T.NoLabels} />}
    renderOption={(props, option, { selected }) => (
      <Box component="li" gap="0.5em" {...props}>
        <CheckIcon style={{ visibility: selected ? 'visible' : 'hidden' }} />
        <StatusCircle color={getColorFromString(option)} size={18} />
        <Typography noWrap variant="body2" sx={{ flexGrow: 1 }}>
          {option}
        </Typography>
        <CancelIcon style={{ visibility: selected ? 'visible' : 'hidden' }} />
      </Box>
    )}
    isOptionEqualToValue={(option, value) =>
      Array.isArray(value) ? value.includes(option) : value === option
    }
    options={[...labels].sort((a, b) => {
      // Display the selected labels first.
      let ai = filters.indexOf(a)
      ai = ai === -1 ? filters.length + labels.indexOf(a) : ai
      let bi = filters.indexOf(b)
      bi = bi === -1 ? filters.length + labels.indexOf(b) : bi

      return ai - bi
    })}
    renderInput={(params) => (
      <StyledInput
        ref={params.InputProps.ref}
        inputProps={params.inputProps}
        autoFocus
        placeholder={Tr(T.FilterLabels)}
      />
    )}
  />
)

FilterByLabel.propTypes = {
  currentValue: PropTypes.array,
  filters: PropTypes.array,
  labels: PropTypes.array,
  handleChange: PropTypes.func,
  handleClose: PropTypes.func,
}

FilterByLabel.displayName = 'FilterByLabel'

export default FilterByLabel
