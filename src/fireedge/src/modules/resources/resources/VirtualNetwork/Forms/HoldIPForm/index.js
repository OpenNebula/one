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
import { getAddressType } from '@ModelsModule'
import {
  ADDR_FIELD,
  FIELDS,
  SCHEMA,
} from '@modules/resources/resources/VirtualNetwork/Forms/HoldIPForm/schema'
import { createForm } from '@UtilsModule'

const HoldIPForm = createForm(SCHEMA, FIELDS, {
  transformBeforeSubmit: (formData) => {
    const addr = formData?.[ADDR_FIELD.name]?.trim()
    const addrName = getAddressType(addr)

    if (!addrName) {
      throw new Error('Invalid address')
    }

    return `LEASES = [ ${addrName} = ${addr} ]`
  },
})

const HoldIPFormContent = forwardRef(({ initialValues, onSubmit }, ref) => {
  const { resolver, fields, defaultValues, transformBeforeSubmit } = useMemo(
    () => HoldIPForm(undefined, initialValues),
    [initialValues]
  )

  const methods = useForm({
    mode: 'onChange',
    reValidateMode: 'onSubmit',
    defaultValues,
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
                transformBeforeSubmit?.(schemaData, initialValues) ?? schemaData

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
    [initialValues, methods, onSubmit, resolver, transformBeforeSubmit]
  )

  return (
    <FormProvider {...methods}>
      <FormWithSchema cy="hold-ip" fields={fields} />
    </FormProvider>
  )
})

HoldIPFormContent.propTypes = {
  initialValues: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
}

HoldIPFormContent.displayName = 'HoldIPFormContent'

/**
 * Returns a modal opener for the hold IP form.
 *
 * @returns {Function} Hold IP modal opener
 */
export const useHoldIPFormModal = () => {
  const { showModal } = useModalsApi()
  const holdIPFormRef = useRef()

  const setHoldIPFormRef = useCallback((instance) => {
    holdIPFormRef.current = instance
  }, [])

  /**
   * Submits the nested hold IP form.
   *
   * @returns {Promise<boolean>|boolean} True when the form has been submitted
   */
  const submitHoldIPForm = () => holdIPFormRef.current?.submit() ?? false

  return ({ title, initialValues, onSubmit }) =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title,
        description: (
          <HoldIPFormContent
            ref={setHoldIPFormRef}
            initialValues={initialValues}
            onSubmit={onSubmit}
          />
        ),
        confirmLabel: T.Accept,
        cancelLabel: T.Cancel,
        dialogWidth: { xs: 'calc(100vw - 32px)', md: '520px' },
        dialogMaxWidth: 'calc(100vw - 32px)',
      },
      onSubmit: submitHoldIPForm,
    })
}

export default HoldIPForm
