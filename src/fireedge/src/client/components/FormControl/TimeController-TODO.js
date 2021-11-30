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
import { memo, useState, useEffect } from 'react'
import PropTypes from 'prop-types'

import Flatpickr from 'react-flatpickr'
import { TextField } from '@mui/material'
import { Controller } from 'react-hook-form'

import { Tr } from 'client/components/HOC'
import { ErrorHelper } from 'client/components/FormControl'

const WrapperToLoadLib = ({ children, id, lib }) => {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLib = async (lib) => {
      try {
        await import(lib)
      } finally {
        setLoading(false)
      }
    }

    loadLib()

    return () => {
      // remove all styles when component will be unmounted
      document
        .querySelectorAll(`[id^=${id}]`)
        .forEach((child) => child.parentNode.removeChild(child))
    }
  }, [])

  return loading ? null : children
}

const TimeController = memo(
  ({ control, cy, name, label, error, fieldProps }) => (
    <WrapperToLoadLib
      id="flatpicker"
      lib={'flatpickr/dist/themes/material_blue.css'}
    >
      <Controller
        render={({ value, onChange, onBlur }) => {
          const translated = typeof label === 'string' ? Tr(label) : label

          return (
            <Flatpickr
              onblur={onBlur}
              onChange={onChange}
              // onCreate={function (flatpickr) { this.calendar = flatpickr }}
              onDestroy={() => {
                onChange(undefined)
              }}
              data-enable-time
              options={{ allowInput: true }}
              render={({ defaultValue, ...props }, ref) => (
                <TextField
                  {...props}
                  fullWidth
                  defaultValue={defaultValue}
                  value={value}
                  label={translated}
                  inputProps={{ 'data-cy': cy }}
                  inputRef={ref}
                  error={Boolean(error)}
                  helperText={Boolean(error) && <ErrorHelper label={error} />}
                  FormHelperTextProps={{ 'data-cy': `${cy}-error` }}
                  {...fieldProps}
                />
              )}
            />
          )
        }}
        name={name}
        control={control}
      />
    </WrapperToLoadLib>
  ),
  (prevProps, nextProps) => prevProps.error === nextProps.error
)

TimeController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  multiline: PropTypes.bool,
  name: PropTypes.string.isRequired,
  label: PropTypes.any,
  tooltip: PropTypes.any,
  error: PropTypes.any,
  fieldProps: PropTypes.object,
  formContext: PropTypes.shape({
    setValue: PropTypes.func,
    setError: PropTypes.func,
    clearErrors: PropTypes.func,
    watch: PropTypes.func,
    register: PropTypes.func,
  }),
}

TimeController.defaultProps = {
  control: {},
  cy: 'cy',
  name: '',
  label: '',
  error: false,
  fieldProps: undefined,
}

TimeController.displayName = 'TimeController'

export default TimeController
