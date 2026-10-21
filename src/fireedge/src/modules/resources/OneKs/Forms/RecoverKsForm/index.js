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
import { Box } from '@mui/material'

import { FormWithSchema, ResourceActionConfirmation } from '@ComponentsModule'
import { T } from '@ConstantsModule'
import { useModalsApi } from '@FeaturesModule'
import {
  FIELDS,
  SCHEMA,
} from '@modules/resources/OneKs/Forms/RecoverKsForm/schema'
import { createForm } from '@UtilsModule'

const RecoverKsForm = createForm(SCHEMA, FIELDS)

const RecoverKsFormContent = forwardRef(
  ({ resources, isNodeGroup, onSubmit }, ref) => {
    const { resolver, fields, defaultValues } = useMemo(
      () => RecoverKsForm({ isNodeGroup }),
      [isNodeGroup]
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
                const template = resolver().cast(formData, {
                  context: formData,
                  isSubmit: true,
                })

                try {
                  await onSubmit(template.action)
                  resolve(true)
                } catch {
                  resolve(false)
                }
              },
              () => resolve(false)
            )()
          }),
      }),
      [methods, onSubmit, resolver]
    )

    return (
      <FormProvider {...methods}>
        <Box sx={{ display: 'grid', gap: 2 }}>
          <ResourceActionConfirmation
            description={T.OneKsRecoverConfirmation}
            resources={resources}
            resourceType={isNodeGroup ? T.NodeGroups : T.KubernetesClusters}
          />
          <FormWithSchema cy="recover-oneks" fields={fields} />
        </Box>
      </FormProvider>
    )
  }
)

RecoverKsFormContent.propTypes = {
  resources: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  isNodeGroup: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
}

RecoverKsFormContent.displayName = 'RecoverKsFormContent'

/**
 * Returns a modal opener for the OneKS recovery form.
 *
 * @returns {Function} OneKS recovery modal opener
 */
export const useRecoverKsFormModal = () => {
  const { showModal } = useModalsApi()
  const recoverFormRef = useRef()

  const setRecoverFormRef = useCallback((instance) => {
    recoverFormRef.current = instance
  }, [])

  const submitRecoverForm = () => recoverFormRef.current?.submit() ?? false

  return ({ title = T.Recover, resources, isNodeGroup = false, onSubmit }) =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title,
        dataCy: isNodeGroup ? 'modal-recover-node' : 'modal-recover-oneks',
        description: (
          <RecoverKsFormContent
            ref={setRecoverFormRef}
            resources={resources}
            isNodeGroup={isNodeGroup}
            onSubmit={onSubmit}
          />
        ),
        confirmLabel: T.Recover,
        cancelLabel: T.Cancel,
        dialogWidth: { xs: 'calc(100vw - 32px)', md: '520px' },
        dialogMaxWidth: 'calc(100vw - 32px)',
      },
      onSubmit: submitRecoverForm,
    })
}

export default RecoverKsForm
