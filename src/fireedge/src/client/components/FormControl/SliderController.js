import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { Typography, TextField, Slider, FormHelperText, Grid } from '@material-ui/core'
import { Controller } from 'react-hook-form'

import { ErrorHelper } from 'client/components/FormControl'
import { Tr } from 'client/components/HOC/Translate'

const SliderController = memo(
  ({ control, cy, name, label, error, fieldProps }) => (
    <>
      <Typography id={`slider-${name}`} gutterBottom>
        {Tr(label)}
      </Typography>
      <Controller
        render={({ value, onChange, onBlur }) =>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs>
              <Slider

                color='secondary'
                value={typeof value === 'number' ? value : 0}
                aria-labelledby={`slider-${name}`}
                valueLabelDisplay="auto"
                data-cy={`${cy}-slider`}
                {...fieldProps}
                onChange={(_, val) => onChange(val)}
              />
            </Grid>
            <Grid item>
              <TextField
                color='secondary'
                fullWidth
                value={value ?? ''}
                error={Boolean(error)}
                type='number'
                inputProps={{
                  'data-cy': `${cy}-input`,
                  'aria-labelledby': `slider-${name}`,
                  ...fieldProps
                }}
                onChange={evt => onChange(
                  evt.target.value === '' ? '0' : Number(evt.target.value)
                )}
                onBlur={onBlur}
              />
            </Grid>
          </Grid>
        }
        name={name}
        control={control}
      />
      {Boolean(error) && (
        <FormHelperText data-cy={`${cy}-error`}>
          <ErrorHelper label={error?.message} />
        </FormHelperText>
      )}
    </>
  ),
  (prevProps, nextProps) => prevProps.error === nextProps.error
)

SliderController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  multiple: PropTypes.bool,
  values: PropTypes.arrayOf(PropTypes.object).isRequired,
  error: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.objectOf(PropTypes.any)
  ]),
  fieldProps: PropTypes.object
}

SliderController.defaultProps = {
  control: {},
  cy: 'cy',
  name: '',
  label: '',
  multiple: false,
  values: [],
  error: false,
  fieldProps: undefined
}

SliderController.displayName = 'SliderController'

export default SliderController
