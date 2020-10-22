import React from 'react'
import PropTypes from 'prop-types'

import { Box, Grid } from '@material-ui/core'
import { useFormContext, useWatch } from 'react-hook-form'

import { INPUT_TYPES } from 'client/constants'
import TextController from 'client/components/FormControl/TextController'
import SelectController from 'client/components/FormControl/SelectController'
import CheckboxController from 'client/components/FormControl/CheckboxController'
import AutocompleteController from 'client/components/FormControl/AutocompleteController'
import { get } from 'client/utils/helpers'

const InputController = {
  [INPUT_TYPES.TEXT]: TextController,
  [INPUT_TYPES.SELECT]: SelectController,
  [INPUT_TYPES.CHECKBOX]: CheckboxController,
  [INPUT_TYPES.AUTOCOMPLETE]: AutocompleteController
}
const HiddenInput = ({ isHidden, children }) =>
  isHidden ? <Box display="none">{children}</Box> : children

const FormWithSchema = ({ id, cy, fields }) => {
  const { control, errors } = useFormContext()

  return (
    <Grid container spacing={1}>
      {fields?.map(
        ({ name, type, htmlType, label, values, dependOf, tooltip, grid }) => {
          const dataCy = `${cy}-${name}`
          const inputName = id ? `${id}.${name}` : name

          const inputError = get(errors, inputName) ?? false

          const dependValue = dependOf
            ? useWatch({ control, name: id ? `${id}.${dependOf}` : dependOf })
            : null

          const htmlTypeValue = typeof htmlType === 'function' && dependOf
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
                    type: htmlTypeValue,
                    name: inputName,
                    label,
                    tooltip,
                    values: typeof values === 'function' && dependOf
                      ? values(dependValue)
                      : values,
                    error: inputError
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
