/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { AlertDialog } from '@ComponentsV2Module'

/**
 * Creates dialog with a form inside.
 *
 * @param {object} props - Props
 * @param {object} props.values - Default values
 * @param {function():AnySchema} props.resolver - Resolver schema
 * @param {function():Promise} props.handleSubmit - Submit function
 * @param {function():Promise} props.handleCancel - Cancel function
 * @param {object} props.dialogProps - Dialog props
 * @param {ReactElement|ReactElement[]} props.children - Children element
 * @returns {ReactElement} Dialog with form
 */
const DialogForm = ({
  values,
  resolver,
  handleSubmit,
  handleCancel,
  dialogProps,
  children,
}) => {
  dialogProps.fixedWidth ??= true
  dialogProps.fixedHeight ??= true
  const { validateOn: validationMode = 'onChange' } = dialogProps ?? {}

  const methods = useForm({
    mode: validationMode,
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

  const isSubmitting = methods.formState.isSubmitting

  const {
    title,
    description,
    subheader,
    confirmLabel,
    cancelLabel,
    validateOn,
    dataCy,
    fixedWidth,
    fixedHeight,
    ...alertDialogProps
  } = dialogProps // TODO: Rename all occurances of subheader to description

  return (
    <AlertDialog
      dataCy={dataCy}
      title={title}
      onSubmit={handleSubmit && methods.handleSubmit(callbackSubmit)}
      onCancel={handleCancel}
      isCancelDisabled={isSubmitting}
      isConfirmDisabled={isSubmitting}
      description={description || subheader}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      {...alertDialogProps}
    >
      <FormProvider {...methods}>{children}</FormProvider>
    </AlertDialog>
  )
}

DialogForm.propTypes = {
  values: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.any),
    PropTypes.objectOf(PropTypes.any),
  ]),
  resolver: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func,
  handleCancel: PropTypes.func,
  dialogProps: PropTypes.object,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.func,
  ]),
}

export default DialogForm
