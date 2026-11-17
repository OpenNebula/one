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
import PropTypes from 'prop-types'
import { FormProvider, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { T } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'
import { AlertDialog } from '@modules/components/primitives/AlertDialog'
import { FormWithSchema } from '@modules/components/composed/Forms/FormWithSchema'

/**
 * Displays a single-page form in a dialog.
 *
 * @param {object} props - Component props
 * @param {string} props.title - Dialog title
 * @param {Function|object[]} props.fields - Fields from the form configuration
 * @param {Function} props.resolver - Form schema factory
 * @param {object} props.defaultValues - Initial form values
 * @param {Function} props.onSubmit - Continue with the validated form values
 * @param {Function} props.onCancel - Cancel resource creation
 * @param {string} props.confirmLabel - Continue button label
 * @param {string} props.cancelLabel - Cancel button label
 * @param {string} props.dataCy - Dialog selector
 * @param {string} props.formDataCy - Form fields selector prefix
 * @param {object} props.sx - Dialog and section style overrides
 * @returns {object} Form dialog
 */
export const SimpleFormDialog = ({
  title,
  fields,
  resolver,
  defaultValues,
  onSubmit,
  onCancel,
  confirmLabel = T.Start,
  cancelLabel = T.Cancel,
  dataCy,
  formDataCy = dataCy ? `${dataCy}-form` : undefined,
  sx = {},
  ...rest
}) => {
  const { translate } = useTranslation()
  const methods = useForm({
    defaultValues,
    resolver: yupResolver(resolver()),
  })

  return (
    <FormProvider {...methods}>
      <AlertDialog
        {...rest}
        dataCy={dataCy}
        title={translate(title)}
        actionsProps={{
          cancel: {
            label: translate(cancelLabel),
            onClick: onCancel,
          },
          confirm: {
            label: translate(confirmLabel),
            htmlType: 'submit',
          },
        }}
        PaperProps={{
          component: 'form',
          noValidate: true,
          onSubmit: methods.handleSubmit(onSubmit),
        }}
        sx={{
          padding: '40px',
          width: '815px',
          minWidth: '0',
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: '70vh',
          header: { marginBottom: '24px' },
          actions: { marginTop: '20px' },
          ...sx,
        }}
      >
        <FormWithSchema
          cy={formDataCy}
          fields={fields}
          gridContainerSx={{
            rowGap: (theme) => `${theme.scale[600]}px`,
            mt: 0,
            '& > .MuiGrid-item': { pt: 0 },
          }}
        />
      </AlertDialog>
    </FormProvider>
  )
}

SimpleFormDialog.propTypes = {
  title: PropTypes.string.isRequired,
  fields: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.arrayOf(PropTypes.object),
  ]).isRequired,
  resolver: PropTypes.func.isRequired,
  defaultValues: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  dataCy: PropTypes.string,
  formDataCy: PropTypes.string,
  sx: PropTypes.object,
}

SimpleFormDialog.displayName = 'SimpleFormDialog'
