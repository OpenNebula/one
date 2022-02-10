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
import { memo, useState, useRef, useEffect, ChangeEvent } from 'react'
import PropTypes from 'prop-types'

import { styled, FormControl, FormHelperText } from '@mui/material'
import { Check as CheckIcon, Page as FileIcon } from 'iconoir-react'
import { useController } from 'react-hook-form'

import {
  ErrorHelper,
  Tooltip,
  SubmitButton,
} from 'client/components/FormControl'
import { Tr, labelCanBeTranslated } from 'client/components/HOC'
import { generateKey } from 'client/utils'

const HiddenInput = styled('input')({ display: 'none' })

const Label = styled('label')(({ theme, error }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '1em',
  ...(error && {
    color: theme.palette.error.main,
  }),
}))

const FileController = memo(
  ({
    control,
    cy = `input-file-${generateKey()}`,
    name = '',
    label = '',
    tooltip = '',
    validationBeforeTransform,
    transform,
    fieldProps = {},
    formContext = {},
  }) => {
    const { setValue, setError, clearErrors, watch } = formContext

    const {
      field: { ref, value, onChange, ...inputProps },
      fieldState: { error },
    } = useController({ name, control })

    const [isLoading, setLoading] = useState(() => false)
    const [success, setSuccess] = useState(() => !error && !!watch(name))
    const timer = useRef()

    useEffect(
      () => () => {
        clearTimeout(timer.current)
      },
      []
    )

    /**
     * Simulate 1 second loading, then set success or error.
     *
     * @param {string} message - Message
     */
    const handleDelayState = (message) => {
      // simulate is loading for one second
      timer.current = setTimeout(() => {
        setSuccess(!message)
        setLoading(false)

        message && setError(name, { type: 'manual', message })
      }, 1000)
    }

    /**
     * Handle change to validate the files.
     *
     * @param {ChangeEvent} event - Change event object
     */
    const handleChange = async (event) => {
      try {
        const file = event.target.files?.[0]

        if (!file) return

        setSuccess(false)
        setLoading(true)
        clearErrors(name)

        const errorMessage = validationBeforeTransform
          ?.map(({ message, test }) => test(file) && message)
          ?.filter(Boolean)

        if (errorMessage?.length) throw errorMessage[0]

        const parsedValue = transform ? await transform(file) : file
        setValue(name, parsedValue)
        handleDelayState()
      } catch (err) {
        setValue(name, undefined)
        handleDelayState(err?.message ?? err)
      }
    }

    return (
      <FormControl fullWidth margin="dense">
        <HiddenInput
          {...inputProps}
          ref={ref}
          id={cy}
          type="file"
          onChange={handleChange}
          {...fieldProps}
        />
        <Label htmlFor={cy} error={error ? 'error' : undefined}>
          <SubmitButton
            color={success ? 'success' : 'secondary'}
            component="span"
            data-cy={`${cy}-button`}
            isSubmitting={isLoading}
            label={success ? <CheckIcon /> : <FileIcon />}
          />
          {labelCanBeTranslated(label) ? Tr(label) : label}
          {tooltip && <Tooltip title={tooltip} />}
        </Label>
        {Boolean(error) && (
          <FormHelperText data-cy={`${cy}-error`}>
            <ErrorHelper label={error?.message} />
          </FormHelperText>
        )}
      </FormControl>
    )
  },
  (prevProps, nextProps) =>
    prevProps.type === nextProps.type && prevProps.label === nextProps.label
)

FileController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.any,
  tooltip: PropTypes.any,
  validationBeforeTransform: PropTypes.arrayOf(
    PropTypes.shape({
      message: PropTypes.string,
      test: PropTypes.func,
    })
  ),
  transform: PropTypes.func,
  fieldProps: PropTypes.object,
  formContext: PropTypes.shape({
    setValue: PropTypes.func,
    setError: PropTypes.func,
    clearErrors: PropTypes.func,
    watch: PropTypes.func,
    register: PropTypes.func,
  }),
}

FileController.displayName = 'FileController'

export default FileController
