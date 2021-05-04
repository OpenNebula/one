import React, { memo, useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'

import { makeStyles, FormControl, FormHelperText } from '@material-ui/core'
import { Check, InsertDriveFile } from '@material-ui/icons'
import { Controller } from 'react-hook-form'

import { ErrorHelper, SubmitButton } from 'client/components/FormControl'

const useStyles = makeStyles(theme => ({
  hide: {
    display: 'none'
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '1em',
    padding: '0.5em',
    borderBottom: `1px solid ${theme.palette.text.secondary}`
  },
  button: {
    '&:hover': {
      backgroundColor: theme.palette.secondary.dark
    }
  },
  buttonSuccess: {
    backgroundColor: theme.palette.success.main,
    '&:hover': {
      backgroundColor: theme.palette.success.dark
    }
  }
}))

const FileController = memo(
  ({ control, cy, name, label, error, fieldProps, validationBeforeTransform, transform, formContext }) => {
    const { setValue, setError, clearErrors, watch, register } = formContext

    const classes = useStyles()
    const [isLoading, setLoading] = useState(() => false)
    const [success, setSuccess] = useState(() => !error && !!watch(name))
    const timer = useRef()

    useEffect(() => {
      return () => {
        clearTimeout(timer.current)
      }
    }, [])

    const handleDelayState = message => {
    // simulate is loading for one second
      timer.current = window.setTimeout(() => {
        setSuccess(!message)
        setLoading(false)

        message && setError(name, { type: 'manual', message })
      }, 1000)
    }

    const handleChange = async event => {
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
      } catch (message) {
        setValue(name, undefined)
        handleDelayState(message)
      }
    }

    return (
      <FormControl fullWidth>
        <Controller
          render={() => (
            <input
              {...register(name)}
              className={classes.hide}
              id={cy}
              type='file'
              onChange={handleChange}
              {...fieldProps}
            />
          )}
          name={name}
          control={control}
        />
        <label htmlFor={cy} className={classes.label}>
          <SubmitButton
            color='secondary'
            component='span'
            data-cy={`${cy}-button`}
            isSubmitting={isLoading}
            label={success ? <Check /> : <InsertDriveFile />}
            className={clsx({
              [classes.buttonSuccess]: success
            })}
          />
          {label}
        </label>
        {Boolean(error) && (
          <FormHelperText data-cy={`${cy}-error`}>
            <ErrorHelper label={error?.message} />
          </FormHelperText>
        )}
      </FormControl>
    )
  },
  (prevProps, nextProps) =>
    prevProps.error === nextProps.error && prevProps.type === nextProps.type
)

FileController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  multiline: PropTypes.bool,
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  error: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.objectOf(PropTypes.any)
  ]),
  validationBeforeTransform: PropTypes.arrayOf(
    PropTypes.shape({
      message: PropTypes.string,
      test: PropTypes.func
    })
  ),
  transform: PropTypes.func,
  fieldProps: PropTypes.object,
  formContext: PropTypes.shape({
    setValue: PropTypes.func,
    setError: PropTypes.func,
    clearErrors: PropTypes.func,
    watch: PropTypes.func,
    register: PropTypes.func
  })
}

FileController.defaultProps = {
  control: {},
  cy: 'cy',
  name: '',
  label: '',
  error: false,
  validationBeforeTransform: undefined,
  transform: undefined,
  fieldProps: undefined
}

FileController.displayName = 'FileController'

export default FileController
