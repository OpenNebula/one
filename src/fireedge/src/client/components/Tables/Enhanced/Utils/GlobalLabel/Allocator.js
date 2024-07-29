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
import { ReactElement, useCallback } from 'react'
import PropTypes from 'prop-types'

import CheckIcon from 'iconoir-react/dist/Check'
import MinusIcon from 'iconoir-react/dist/Minus'
import { styled, debounce, Box, Typography, Autocomplete } from '@mui/material'

import {
  PopperComponent,
  StyledInput,
} from 'client/components/Tables/Enhanced/Utils/GlobalLabel/styles'
import { StatusCircle } from 'client/components/Status'
import { getColorFromString } from 'client/models/Helper'
import { Translate, Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const EmptyIcon = styled((props) => <Box component="span" {...props} />)({
  width: 20,
  height: 20,
})

const Label = ({ label, indeterminate, selected, ...props }) => (
  <Box component="li" gap="0.5em" {...props}>
    {selected ? <CheckIcon /> : indeterminate ? <MinusIcon /> : <EmptyIcon />}
    <StatusCircle color={getColorFromString(label)} size={18} />
    <Typography noWrap variant="body2" sx={{ flexGrow: 1 }}>
      {label}
    </Typography>
  </Box>
)

Label.propTypes = {
  label: PropTypes.any,
  indeterminate: PropTypes.bool,
  selected: PropTypes.bool,
}

/**
 * Allocates labels to the selected rows.
 *
 * @param {object} props - Component props
 * @param {string[]} props.labels - The list of available labels
 * @param {string<string[]>} props.selectedLabels - The list of selected labels
 * @param {string[]} props.pendingValue - The current value of the filter
 * @param {function(any)} props.handleChange - Handle change event
 * @param {function()} props.handleClose - Handle close event
 * @returns {ReactElement} Allocator component
 */
const LabelAllocator = ({
  labels,
  selectedLabels,
  pendingValue,
  handleChange,
  handleClose,
}) => {
  const getLabelProps = useCallback(
    (label) => {
      const labelProps = { label }

      // labels that exists on every row
      if (pendingValue[0]?.includes(label))
        return { ...labelProps, selected: true }

      // labels to remove from every row
      if (pendingValue[1]?.includes(label)) {
        return { ...labelProps, selected: false }
      }

      return selectedLabels.reduce((res, rowLabels) => {
        const hasLabel = rowLabels.includes(label)
        const prevSelected = [true, undefined].includes(res.selected)

        hasLabel
          ? (res.indeterminate = !prevSelected)
          : (res.indeterminate ||= res.selected)

        return { ...res, selected: hasLabel && prevSelected }
      }, labelProps)
    },
    [pendingValue, selectedLabels]
  )

  const handleLabelChange = useCallback(
    debounce((event, newValue, reason) => {
      const changeFn = {
        selectOption: ([, toRemove = []] = []) => [
          newValue,
          toRemove?.filter((label) => !newValue.includes(label)),
        ],
        removeOption: ([toAdd = [], toRemove = []] = []) => {
          const prevToAdd = toAdd?.filter((label) => !newValue.includes(label))
          const newToRemove = [...toRemove, ...prevToAdd]

          return [newValue, [...new Set(newToRemove)]]
        },
      }[reason]

      changeFn && handleChange(changeFn)
    }, 200),
    [handleChange]
  )

  return (
    <Autocomplete
      open
      multiple
      value={pendingValue[0]}
      onClose={(_, reason) => reason === 'escape' && handleClose()}
      onChange={handleLabelChange}
      disableCloseOnSelect
      PopperComponent={PopperComponent}
      renderTags={() => null}
      noOptionsText={<Translate word={T.NoLabels} />}
      renderOption={(props, label) => (
        <Label key={label} {...props} {...getLabelProps(label)} />
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
}

LabelAllocator.propTypes = {
  labels: PropTypes.array,
  selectedLabels: PropTypes.array,
  indeterminateLabels: PropTypes.array,
  pendingValue: PropTypes.array,
  handleChange: PropTypes.func,
  handleClose: PropTypes.func,
}

LabelAllocator.displayName = 'LabelAllocator'

export default LabelAllocator
