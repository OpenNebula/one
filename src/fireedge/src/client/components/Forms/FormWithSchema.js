import * as React from 'react'
import PropTypes from 'prop-types'

import { Box, Grid } from '@material-ui/core'
import { useFormContext, useWatch } from 'react-hook-form'

import * as FC from 'client/components/FormControl'
import { INPUT_TYPES } from 'client/constants'
import { get } from 'client/utils'

const InputController = {
  [INPUT_TYPES.TEXT]: FC.TextController,
  [INPUT_TYPES.PASSWORD]: FC.PasswordController,
  [INPUT_TYPES.SELECT]: FC.SelectController,
  [INPUT_TYPES.SLIDER]: FC.SliderController,
  [INPUT_TYPES.CHECKBOX]: FC.CheckboxController,
  [INPUT_TYPES.AUTOCOMPLETE]: FC.AutocompleteController,
  [INPUT_TYPES.FILE]: FC.FileController
}
const HiddenInput = ({ isHidden, children }) =>
  isHidden ? <Box display="none">{children}</Box> : children

const FormWithSchema = ({ id, cy, fields }) => {
  const { control, errors, ...formContext } = useFormContext()

  return (
    <Grid container spacing={1}>
      {fields?.map(
        ({ name, type, htmlType, values, dependOf, grid, ...restOfProps }) => {
          const dataCy = `${cy}-${name}`
          const inputName = id ? `${id}.${name}` : name

          const inputError = get(errors, inputName) ?? false

          const dependValue = dependOf
            ? useWatch({ control, name: id ? `${id}.${dependOf}` : dependOf })
            : null

          const htmlTypeValue = typeof htmlType === 'function'
            ? htmlType(dependValue)
            : htmlType

          const isHidden = htmlTypeValue === INPUT_TYPES.HIDDEN

          return (
            InputController[type] && (
              <HiddenInput key={`${cy}-${name}`} isHidden={isHidden}>
                <Grid item xs={12} md={6} {...grid}>
                  {React.createElement(InputController[type], {
                    control,
                    cy: dataCy,
                    error: inputError,
                    formContext,
                    name: inputName,
                    type: htmlTypeValue,
                    values: typeof values === 'function'
                      ? values(dependValue)
                      : values,
                    ...restOfProps
                  })}
                </Grid>
              </HiddenInput>
            )
          )
        }
      )}
    </Grid>
  )
}

HiddenInput.propTypes = {
  isHidden: PropTypes.bool,
  children: PropTypes.object
}

FormWithSchema.propTypes = {
  id: PropTypes.string,
  cy: PropTypes.string,
  fields: PropTypes.arrayOf(PropTypes.object)
}

export default FormWithSchema
