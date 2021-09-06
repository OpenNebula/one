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
/* eslint-disable jsdoc/require-jsdoc */
import { createElement, useMemo } from 'react'
import PropTypes from 'prop-types'

import { styled, Grid } from '@material-ui/core'
import { useFormContext, useWatch } from 'react-hook-form'

import * as FC from 'client/components/FormControl'
import { INPUT_TYPES } from 'client/constants'
import { get } from 'client/utils'

const Fieldset = styled('fieldset')({ border: 'none' })

const Legend = styled('legend')(({ theme }) => ({
  ...theme.typography.subtitle1,
  marginBottom: '1em',
  padding: '0em 1em 0.2em 0.5em',
  borderBottom: `2px solid ${theme.palette.secondary.main}`
}))

const InputController = {
  [INPUT_TYPES.TEXT]: FC.TextController,
  [INPUT_TYPES.PASSWORD]: FC.PasswordController,
  [INPUT_TYPES.SELECT]: FC.SelectController,
  [INPUT_TYPES.SLIDER]: FC.SliderController,
  [INPUT_TYPES.CHECKBOX]: FC.CheckboxController,
  [INPUT_TYPES.AUTOCOMPLETE]: FC.AutocompleteController,
  [INPUT_TYPES.FILE]: FC.FileController,
  [INPUT_TYPES.TIME]: FC.TimeController
}

const FormWithSchema = ({ id, cy, fields, className, legend }) => {
  const { control, errors, ...formContext } = useFormContext()
  const getFields = useMemo(() => typeof fields === 'function' ? fields() : fields, [])

  return (
    <Fieldset className={className}>
      {legend && <Legend>{legend}</Legend>}
      <Grid container spacing={1} alignContent='flex-start'>
        {getFields?.map?.(
          ({ dependOf, ...props }) => {
            let valueOfDependField = null
            if (dependOf) {
              const nameOfDependField = id
                ? Array.isArray(dependOf) ? dependOf.map(d => `${id}.${d}`) : `${id}.${dependOf}`
                : dependOf

              valueOfDependField = useWatch({ control, name: nameOfDependField })
            }

            const { name, type, htmlType, grid, ...fieldProps } = Object
              .entries(props)
              .reduce((field, property) => {
                const [key, value] = property
                const finalValue = typeof value === 'function' ? value(valueOfDependField) : value

                return { ...field, [key]: finalValue }
              }, {})

            const dataCy = `${cy}-${name}`
            const inputName = id ? `${id}.${name}` : name

            const inputError = get(errors, inputName) ?? false

            const isHidden = htmlType === INPUT_TYPES.HIDDEN

            if (isHidden) return null

            return (
              InputController[type] && (
                <Grid key={dataCy} item xs={12} md={6} {...grid}>
                  {createElement(InputController[type], {
                    control,
                    cy: dataCy,
                    error: inputError,
                    formContext,
                    name: inputName,
                    type: htmlType,
                    ...fieldProps
                  })}
                </Grid>
              )
            )
          }
        )}
      </Grid>
    </Fieldset>
  )
}

FormWithSchema.propTypes = {
  id: PropTypes.string,
  cy: PropTypes.string,
  fields: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.arrayOf(PropTypes.object)
  ]),
  legend: PropTypes.string,
  className: PropTypes.string
}

export default FormWithSchema
