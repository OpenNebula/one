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

import { useModalsApi } from '@FeaturesModule'
import ContentForm, {
  CUSTOM_ATTRS_ID,
} from '@modules/resources/resources/VirtualNetwork/Forms/AddRangeForm/content'
import {
  FIELDS,
  SCHEMA,
} from '@modules/resources/resources/VirtualNetwork/Forms/AddRangeForm/schema'
import {
  dialogContentMaxHeight,
  dialogMaxWidth,
  dialogWidth,
} from '@modules/resources/resources/VirtualNetwork/Forms/AddRangeForm/styles'
import { T } from '@ConstantsModule'
import { createForm } from '@UtilsModule'

// List of attributes that can't be changed in update operation
const IMMUTABLE_ATTRS = [
  'AR_ID',
  'SHARED',
  'SIZE',
  'TYPE',
  'IP',
  'IP_END',
  'IP6',
  'IP6_END',
  'MAC',
  'MAC_END',
  'IP6_GLOBAL',
  'IP6_GLOBAL_END',
  'GLOBAL_PREFIX',
  'ULA_PREFIX',
  'USED_LEASES',
  'PARENT_NETWORK_AR_ID',
  'LEASES',
  'IPAM_MAD',
]

// List of attributes that should be hide from attributes panel
const IGNORED_ATTRS = [
  'ID',
  'INDEX',
  'NEXT_INDEX',
  'POSITION',
  '__ORIGINAL_ADDRESS_RANGE__',
]

const sharedRemoveData = ['MAC']

const getFormFieldNames = () => FIELDS().map(({ name }) => name)

const removeSharedData = (data) => {
  Object.keys(data).forEach((attr) => {
    if (sharedRemoveData.some((prefix) => attr.startsWith(prefix))) {
      delete data[attr]
    }
  })

  return data
}

const cleanSharedData = (data) => {
  if (data?.SHARED === 'YES') {
    removeSharedData(data)
    if (data.LEASES?.LEASE) {
      removeSharedData(data.LEASES.LEASE)
    }
  }

  return data
}

const AddRangeForm = createForm(SCHEMA, undefined, {
  ContentForm,
  transformInitialValue: (addressRange) => {
    if (!addressRange) return {}

    const formAttrs = {}
    const customAttrs = {}
    const fieldNames = getFormFieldNames()

    for (const [attr, value] of Object.entries(addressRange)) {
      if (IGNORED_ATTRS.includes(attr)) continue

      if (fieldNames.includes(attr)) {
        formAttrs[attr] = value
      } else if (!IMMUTABLE_ATTRS.includes(attr)) {
        customAttrs[attr] = value
      }
    }

    if (formAttrs?.SHARED === 'NO') formAttrs.SHARED = false
    if (formAttrs?.SHARED === 'YES') formAttrs.SHARED = true

    return {
      ...formAttrs,
      ...(Object.keys(customAttrs).length && {
        [CUSTOM_ATTRS_ID]: customAttrs,
      }),
    }
  },
  transformBeforeSubmit: (formData, _, stepProps) => {
    const filteredData = cleanSharedData(formData)

    const { [CUSTOM_ATTRS_ID]: customAttrs = {}, ...rest } = filteredData ?? {}
    const submitData = { ...customAttrs, ...rest }

    if (stepProps?.isUpdate) {
      IMMUTABLE_ATTRS.forEach((attr) => delete submitData[attr])
    }

    return submitData
  },
})

const normalizeDefaultValues = (values = {}) => ({
  ...values,
  ...(values.SIZE != null && { SIZE: String(values.SIZE) }),
})

const AddressRangeFormContent = forwardRef(
  ({ initialValues, stepProps, onSubmit }, ref) => {
    const {
      resolver,
      defaultValues,
      ContentForm: FormContent,
      transformBeforeSubmit,
    } = useMemo(
      () => AddRangeForm(stepProps, initialValues),
      [initialValues, stepProps]
    )

    const methods = useForm({
      mode: 'onChange',
      reValidateMode: 'onSubmit',
      defaultValues: normalizeDefaultValues(defaultValues),
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
        <FormContent />
      </FormProvider>
    )
  }
)

AddressRangeFormContent.propTypes = {
  initialValues: PropTypes.object,
  stepProps: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

AddressRangeFormContent.displayName = 'AddressRangeFormContent'

/**
 * Returns a modal opener for the address range form.
 *
 * @returns {Function} Address range modal opener
 */
export const useAddressRangeFormModal = () => {
  const { showModal } = useModalsApi()
  const addressRangeFormRef = useRef()

  const setAddressRangeFormRef = useCallback((instance) => {
    addressRangeFormRef.current = instance
  }, [])

  /**
   * Submits the nested address range form.
   *
   * @returns {Promise<boolean>|boolean} True when the form has been submitted
   */
  const submitAddressRangeForm = () =>
    addressRangeFormRef.current?.submit() ?? false

  return ({ title, initialValues, stepProps, onSubmit }) =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title,
        description: (
          <AddressRangeFormContent
            ref={setAddressRangeFormRef}
            initialValues={initialValues}
            stepProps={stepProps}
            onSubmit={onSubmit}
          />
        ),
        confirmLabel: T.Accept,
        cancelLabel: T.Cancel,
        dialogWidth,
        dialogMaxWidth,
        dialogContentMaxHeight,
      },
      onSubmit: submitAddressRangeForm,
    })
}

export default AddRangeForm
