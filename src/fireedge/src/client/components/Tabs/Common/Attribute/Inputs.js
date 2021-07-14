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

import * as Actions from 'client/components/Tabs/Common/Attribute/Actions'

const useStyles = makeStyles({
  select: {
    textOverflow: 'ellipsis'
  }
})

const Select = React.forwardRef(
  /**
   * @param {object} props - Props
   * @param {string} props.name - Attribute name
   * @param {string} props.value - Attribute value
   * @param {{
   * text:string,
   * value:string}[]
   * } props.options - Options available
   * @param {React.ForwardedRef} ref - Forward reference
   * @returns {React.JSXElementConstructor} Select field
   */
  ({ name, value, options }, ref) => {
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

Select.displayName = 'Select'

Select.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      value: PropTypes.string
    })
  )
}

export { Select }
