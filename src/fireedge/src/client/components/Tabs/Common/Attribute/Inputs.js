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
import { Grid, Slider, TextField } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import { prettyBytes } from 'client/utils'
import PropTypes from 'prop-types'
import {
  ForwardedRef,
  JSXElementConstructor,
  forwardRef,
  useState,
} from 'react'
import { Tr } from 'client/components/HOC'

import { Actions } from 'client/components/Tabs/Common/Attribute'

/**
 * @typedef {object} Option
 * @property {string|number|JSXElementConstructor} text - Options text to show
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
    textOverflow: 'ellipsis',
  },
})

const useStylesInput = makeStyles((theme) => ({
  input: (color) => {
    const styles = {}
    const backgroundColor = theme?.palette?.[color.inputColor]?.[100]
    if (backgroundColor) {
      styles.backgroundColor = backgroundColor
    }

    return styles
  },
}))

const Select = forwardRef(
  /**
   * @param {InputProps} props - Props
   * @param {ForwardedRef} ref - Forward reference
   * @returns {JSXElementConstructor} Select field
   */
  ({ name = '', initialValue = '', options }, ref) => {
    const classes = useStyles()
    const [newValue, setNewValue] = useState(() => initialValue)

    const handleChange = (event) => setNewValue(event.target.value)

    return (
      <TextField
        inputProps={{
          'data-cy': Actions.getAttributeCy('select', name),
          className: classes.select,
        }}
        inputRef={ref}
        onChange={handleChange}
        select
        SelectProps={{ native: true }}
        value={newValue}
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

const Text = forwardRef(
  /**
   * @param {InputProps} props - Props
   * @param {ForwardedRef} ref - Forward reference
   * @returns {JSXElementConstructor} Text field
   */
  ({ name = '', initialValue = '', ...props }, ref) => {
    const [newValue, setNewValue] = useState(() => initialValue)

    const handleChange = (event) => setNewValue(event.target.value)

    return (
      <TextField
        inputProps={{
          'data-cy': Actions.getAttributeCy('text', name),
        }}
        inputRef={ref}
        onChange={handleChange}
        value={newValue}
        name={Tr(name)}
        {...props}
      />
    )
  }
)

const SliderInput = forwardRef(
  /**
   * @param {InputProps} props - Props
   * @param {ForwardedRef} ref - Forward reference
   * @returns {JSXElementConstructor} Text field
   */
  ({ name = '', initialValue = '', min, max, unitParser, ...props }, ref) => {
    const [newValue, setNewValue] = useState(() => +initialValue)
    const [inputColor, setInputColor] = useState()

    const handleChange = (event) => {
      const targetValue = +event.target.value
      setNewValue(targetValue < min ? min : targetValue)
      setInputColor(
        targetValue > +initialValue
          ? 'success'
          : targetValue < +initialValue
          ? 'error'
          : ''
      )
    }
    const classes = useStylesInput({ inputColor })

    return (
      <Grid container>
        <Grid item xs={12}>
          <Slider
            className="slider"
            color="secondary"
            onChange={handleChange}
            value={newValue}
            marks={[
              {
                value: min ?? 0,
                label: unitParser ? prettyBytes(0) : min ?? '0',
              },
              {
                value: max,
                label: unitParser ? prettyBytes(max) : max,
              },
            ]}
            min={min}
            max={max}
            {...props}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            inputProps={{
              'data-cy': Actions.getAttributeCy('text', name),
              className: classes.input,
            }}
            type="number"
            inputRef={ref}
            onChange={handleChange}
            value={newValue}
            name={name}
            {...props}
          />
        </Grid>
      </Grid>
    )
  }
)

const InputPropTypes = {
  name: PropTypes.string,
  initialValue: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      value: PropTypes.string,
    })
  ),
}

const InputSlidePropTypes = {
  name: PropTypes.string,
  initialValue: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      value: PropTypes.string,
    })
  ),
  min: PropTypes.number,
  max: PropTypes.number,
  unitParser: PropTypes.bool,
  inputProps: PropTypes.object,
}

Select.displayName = 'Select'
Select.propTypes = InputPropTypes
Text.displayName = 'Text'
Text.propTypes = InputPropTypes
SliderInput.displayName = 'SliderInput'
SliderInput.propTypes = InputSlidePropTypes

export { InputPropTypes, Select, SliderInput, Text }
