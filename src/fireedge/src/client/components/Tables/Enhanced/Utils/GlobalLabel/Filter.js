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
import PropTypes from 'prop-types'
import { MouseEvent, ReactElement, memo } from 'react'

import { Autocomplete, Box, Tooltip, Typography } from '@mui/material'
import CheckIcon from 'iconoir-react/dist/Check'
import LockIcon from 'iconoir-react/dist/Lock'

import { useAddLabelMutation } from 'client/features/OneApi/auth'

import { SubmitButton } from 'client/components/FormControl'
import { Tr, Translate } from 'client/components/HOC'
import { StatusCircle } from 'client/components/Status'
import {
  PopperComponent,
  StyledInput,
} from 'client/components/Tables/Enhanced/Utils/GlobalLabel/styles'
import { T } from 'client/constants'
import { getColorFromString } from 'client/models/Helper'

const Label = memo(({ label, selected, unknown, filterByLabel, ...props }) => {
  const [addLabel, { isLoading }] = useAddLabelMutation()

  /**
   * Adds the label to user labels.
   *
   * @param {MouseEvent<HTMLLIElement, MouseEvent>} evt - The click event
   */
  const handleLockLabel = async (evt) => {
    evt.stopPropagation()
    await addLabel({ newLabel: label }).unwrap()
  }

  return (
    <Box component="li">
      <Tooltip
        arrow
        placement="right"
        title={<Typography variant="subtitle2">{label}</Typography>}
      >
        <Box gap="0.5em" {...props}>
          <CheckIcon
            style={{
              minWidth: 'fit-content',
              visibility: selected ? 'visible' : 'hidden',
            }}
          />
          <StatusCircle color={getColorFromString(label)} size={18} />
          <Typography noWrap variant="body2" sx={{ flexGrow: 1 }}>
            {label}
          </Typography>
          <SubmitButton
            onClick={unknown ? handleLockLabel : undefined}
            isSubmitting={isLoading}
            title={Tr(T.SavesInTheUserTemplate)}
            icon={<LockIcon />}
            sx={{ p: 0, visibility: unknown ? 'visible' : 'hidden' }}
          />
        </Box>
      </Tooltip>
    </Box>
  )
})

Label.propTypes = {
  label: PropTypes.any,
  selected: PropTypes.bool,
  unknown: PropTypes.bool,
  filterByLabel: PropTypes.func,
}

Label.displayName = 'Label'

/**
 * AutoComplete to filter rows by label.
 *
 * @param {object} props - Component props
 * @param {function(any)} props.handleChange - Handle change event
 * @param {string[]} props.pendingValue - The current value of the filter
 * @param {function()} props.handleClose - Handle close event
 * @param {string[]} props.labels - The list of labels to filter
 * @param {string[]} props.unknownLabels - The list of labels not in the user labels
 * @param {function()} props.handleFilterByLabel - Handle filter by label
 * @returns {ReactElement} Filter component
 */
const FilterByLabel = ({
  labels = [],
  unknownLabels = [],
  pendingValue = [],
  handleChange,
  handleClose,
  handleFilterByLabel,
}) => (
  <Autocomplete
    open
    multiple
    value={pendingValue}
    onClose={(event, reason) => {
      reason === 'escape' && handleClose()
    }}
    onChange={(event, newValue, reason) => {
      if (
        event.type === 'keydown' &&
        event.key === 'Backspace' &&
        reason === 'removeOption'
      ) {
        return
      }

      handleChange(newValue)
      handleFilterByLabel(newValue)
    }}
    disableCloseOnSelect
    PopperComponent={PopperComponent}
    renderTags={() => null}
    noOptionsText={<Translate word={T.NoLabels} />}
    renderOption={(props, option, { selected }) => (
      <Label
        {...props}
        key={option}
        label={option}
        selected={selected}
        unknown={unknownLabels.includes(option)}
      />
    )}
    isOptionEqualToValue={(option, value) =>
      Array.isArray(value) ? value.includes(option) : value === option
    }
    options={labels}
    renderInput={(params) => (
      <StyledInput
        ref={params.InputProps.ref}
        inputProps={params.inputProps}
        autoFocus
        placeholder={Tr(T.Search)}
      />
    )}
  />
)

FilterByLabel.propTypes = {
  labels: PropTypes.array,
  unknownLabels: PropTypes.array,
  pendingValue: PropTypes.array,
  handleChange: PropTypes.func,
  handleClose: PropTypes.func,
  handleFilterByLabel: PropTypes.func,
}

FilterByLabel.displayName = 'FilterByLabel'

export default FilterByLabel
