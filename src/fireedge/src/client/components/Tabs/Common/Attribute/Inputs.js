/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import * as React from 'react'
import PropTypes from 'prop-types'
import { makeStyles, TextField } from '@material-ui/core'

import { Actions } from 'client/components/Tabs/Common/Attribute'

/**
 * @typedef {object} Option
 * @property {string|number|React.JSXElementConstructor} text - Options text to show
 * @property {string|number} value - Option value
 */

/**
 * @typedef {object} InputProps
 * @property {string} name - Attribute name
 * @property {string} value - Attribute name
 * @property {Option[]} [options] - Options
 */

const useStyles = makeStyles({
  select: {
    textOverflow: 'ellipsis'
  }
})

const Select = React.forwardRef(
  /**
   * @param {InputProps} props - Props
   * @param {React.ForwardedRef} ref - Forward reference
   * @returns {React.JSXElementConstructor} Select field
   */
  ({ name = '', value = '', options }, ref) => {
    const classes = useStyles()
    const [newValue, setNewValue] = React.useState(() => value)

    const handleChange = event => setNewValue(event.target.value)

    return (
      <TextField
        color='secondary'
        inputProps={{
          'data-cy': Actions.getAttributeCy('select', name),
          className: classes.select
        }}
        inputRef={ref}
        margin='dense'
        onChange={handleChange}
        select
        SelectProps={{ displayEmpty: true, native: true }}
        value={newValue}
        variant='outlined'
      >
        {options?.map(({ text, value: optionVal = '' }) => (
          <option key={`${name}-${optionVal}`} value={optionVal}>
            {text}
          </option>
        ))}
      </TextField>
    )
  }
)

const Text = React.forwardRef(
  /**
   * @param {InputProps} props - Props
   * @param {React.ForwardedRef} ref - Forward reference
   * @returns {React.JSXElementConstructor} Text field
   */
  ({ name = '', value = '' }, ref) => {
    const [newValue, setNewValue] = React.useState(() => value)

    const handleChange = event => setNewValue(event.target.value)

    return (
      <TextField
        color='secondary'
        inputProps={{
          'data-cy': Actions.getAttributeCy('text', name)
        }}
        inputRef={ref}
        margin='dense'
        onChange={handleChange}
        value={newValue}
        variant='outlined'
      />
    )
  }
)

const InputPropTypes = {
  name: PropTypes.string,
  value: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      value: PropTypes.string
    })
  )
}

Select.displayName = 'Select'
Select.propTypes = InputPropTypes
Text.displayName = 'Text'
Text.propTypes = InputPropTypes

export { Select, Text, InputPropTypes }
