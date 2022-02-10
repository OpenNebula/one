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
import { useCallback, ReactElement } from 'react'
import PropTypes from 'prop-types'
import { AnySchema } from 'yup'

import clsx from 'clsx'
import makeStyles from '@mui/styles/makeStyles'
import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

import DialogConfirmation, {
  DialogPropTypes,
} from 'client/components/Dialogs/DialogConfirmation'

const useStyles = makeStyles((theme) => ({
  content: {
    width: '80vw',
    height: '60vh',
    maxWidth: '100%',
    maxHeight: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.only('xs')]: {
      width: '100vw',
      height: '100vh',
    },
  },
}))

/**
 * Creates dialog with a form inside.
 *
 * @param {object} props - Props
 * @param {object} props.values - Default values
 * @param {function():AnySchema} props.resolver - Resolver schema
 * @param {function():Promise} props.handleSubmit - Submit function
 * @param {object} props.dialogProps - Dialog props
 * @param {ReactElement|ReactElement[]} props.children - Children element
 * @returns {ReactElement} Dialog with form
 */
const DialogForm = ({
  values,
  resolver,
  handleSubmit,
  dialogProps,
  children,
}) => {
  const classes = useStyles()
  const { className, ...contentProps } = dialogProps.contentProps ?? {}

  dialogProps.contentProps = {
    className: clsx(classes.content, className),
    ...contentProps,
  }

  const methods = useForm({
    mode: 'onBlur',
    reValidateMode: 'onSubmit',
    defaultValues: values,
    resolver: yupResolver(resolver()),
  })

  const callbackSubmit = useCallback((formData) => {
    const schemaData = resolver().cast(formData, {
      context: formData,
      isSubmit: true,
    })

    return handleSubmit(schemaData)
  })

  return (
    <DialogConfirmation
      handleAccept={handleSubmit && methods.handleSubmit(callbackSubmit)}
      acceptButtonProps={{
        isSubmitting: methods.formState.isSubmitting,
      }}
      cancelButtonProps={{
        disabled: methods.formState.isSubmitting,
      }}
      {...dialogProps}
    >
      <FormProvider {...methods}>{children}</FormProvider>
    </DialogConfirmation>
  )
}

DialogForm.propTypes = {
  values: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.any),
    PropTypes.objectOf(PropTypes.any),
  ]),
  resolver: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func,
  dialogProps: PropTypes.shape(DialogPropTypes),
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.func,
  ]),
}

export default DialogForm
