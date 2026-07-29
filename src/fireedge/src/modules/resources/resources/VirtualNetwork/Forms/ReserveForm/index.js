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
import { yupResolver } from '@hookform/resolvers/yup'
import PropTypes from 'prop-types'
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import { FormWithSchema } from '@ComponentsV2Module'
import { T } from '@ConstantsModule'
import { useModalsApi } from '@FeaturesModule'
import {
  FIELDS,
  SCHEMA,
} from '@modules/resources/resources/VirtualNetwork/Forms/ReserveForm/schema'
import {
  dialogContentMaxHeight,
  dialogMaxWidth,
  dialogWidth,
} from '@modules/resources/resources/VirtualNetwork/Forms/AddRangeForm/styles'
import { createForm, jsonToXml } from '@UtilsModule'

const ReserveForm = createForm(SCHEMA, FIELDS, {
  transformBeforeSubmit: (formData) => jsonToXml({ ...formData }),
})

const normalizeTextFieldDefaults = (defaultValues = {}) => ({
  ...defaultValues,
  SIZE:
    defaultValues.SIZE === undefined ? undefined : String(defaultValues.SIZE),
})

const ReserveFormContent = forwardRef(
  ({ initialValues, stepProps, onSubmit }, ref) => {
    const { resolver, fields, defaultValues, transformBeforeSubmit } = useMemo(
      () => ReserveForm(stepProps, initialValues),
      [initialValues, stepProps]
    )
    const formDefaultValues = useMemo(
      () => normalizeTextFieldDefaults(defaultValues),
      [defaultValues]
    )

    const methods = useForm({
      mode: 'onChange',
      reValidateMode: 'onSubmit',
      defaultValues: formDefaultValues,
      resolver: yupResolver(resolver()),
    })

    useImperativeHandle(
      ref,
      () => ({
        submit: () =>
          new Promise((resolve) => {
            methods.handleSubmit(
              async (formData) => {
                const schemaData = resolver().cast(formData, {
                  context: formData,
                  isSubmit: true,
                })
                const processedData =
                  transformBeforeSubmit?.(
                    schemaData,
                    initialValues,
                    stepProps
                  ) ?? schemaData

                try {
                  await onSubmit(processedData)
                  resolve(true)
                } catch {
                  resolve(false)
                }
              },
              () => resolve(false)
            )()
          }),
      }),
      [
        initialValues,
        methods,
        onSubmit,
        resolver,
        stepProps,
        transformBeforeSubmit,
      ]
    )

    return (
      <FormProvider {...methods}>
        <FormWithSchema cy="reserve-vnet" fields={fields} />
      </FormProvider>
    )
  }
)

ReserveFormContent.propTypes = {
  initialValues: PropTypes.object,
  stepProps: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

ReserveFormContent.displayName = 'ReserveFormContent'

/**
 * Returns a modal opener for the reserve form.
 *
 * @returns {Function} Reserve modal opener
 */
export const useReserveFormModal = () => {
  const { showModal } = useModalsApi()
  const reserveFormRef = useRef()

  const setReserveFormRef = useCallback((instance) => {
    reserveFormRef.current = instance
  }, [])

  /**
   * Submits the nested reserve form.
   *
   * @returns {Promise<boolean>|boolean} True when the form has been submitted
   */
  const submitReserveForm = () => reserveFormRef.current?.submit() ?? false

  return ({ title, initialValues, stepProps, onSubmit }) =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title,
        description: (
          <ReserveFormContent
            ref={setReserveFormRef}
            initialValues={initialValues}
            stepProps={stepProps}
            onSubmit={onSubmit}
          />
        ),
        confirmLabel: T.Accept,
        cancelLabel: T.Cancel,
        dataCy: 'modal-reserve',
        dialogWidth,
        dialogMaxWidth,
        dialogContentMaxHeight,
      },
      onSubmit: submitReserveForm,
    })
}

export default ReserveForm
