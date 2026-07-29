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
import { Box, Typography } from '@mui/material'

import { FormWithSchema } from '@ComponentsV2Module'
import { T } from '@ConstantsModule'
import { useModalsApi } from '@FeaturesModule'
import { useTranslation } from '@ProvidersModule'
import {
  FIELDS,
  SCHEMA,
} from '@modules/resources/resources/OneKs/Forms/UpgradeKsClusterForm/schema'
import { createForm } from '@UtilsModule'

const UpgradeKsClusterForm = createForm(SCHEMA, FIELDS)

const UpgradeKsClusterFormContent = forwardRef(
  ({ versions = [], highestSupportedVersion, onSubmit }, ref) => {
    const { translate } = useTranslation()
    const { resolver, fields, defaultValues } = useMemo(
      () => UpgradeKsClusterForm({ versions }),
      [versions]
    )
    const isUpgradeAvailable = versions.length > 0

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
                  await onSubmit(template)
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
          {isUpgradeAvailable ? (
            <>
              <Typography variant="body1">
                {translate(T['oneks.form.upgrade.kubernetes_version.help'])}
              </Typography>
              <FormWithSchema cy="upgrade-kubernetes-version" fields={fields} />
            </>
          ) : (
            <Typography variant="body1">
              {translate(
                T['oneks.form.upgrade.kubernetes_version.up_to_date'],
                [highestSupportedVersion ?? '-']
              )}
            </Typography>
          )}
        </Box>
      </FormProvider>
    )
  }
)

UpgradeKsClusterFormContent.propTypes = {
  versions: PropTypes.arrayOf(PropTypes.string),
  highestSupportedVersion: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
}

UpgradeKsClusterFormContent.displayName = 'UpgradeKsClusterFormContent'

/**
 * Returns a modal opener for the Kubernetes version upgrade form.
 *
 * @returns {Function} Kubernetes upgrade modal opener
 */
export const useUpgradeKsClusterFormModal = () => {
  const { showModal } = useModalsApi()
  const upgradeFormRef = useRef()

  const setUpgradeFormRef = useCallback((instance) => {
    upgradeFormRef.current = instance
  }, [])

  const submitUpgradeForm = () => upgradeFormRef.current?.submit() ?? false

  return ({ versions = [], highestSupportedVersion, onSubmit }) => {
    const isUpgradeAvailable = versions.length > 0

    return showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T.UpgradeK8sCluster,
        dataCy: 'modal-upgrade-oneks',
        description: (
          <UpgradeKsClusterFormContent
            ref={setUpgradeFormRef}
            versions={versions}
            highestSupportedVersion={highestSupportedVersion}
            onSubmit={onSubmit}
          />
        ),
        confirmLabel: isUpgradeAvailable ? T.Upgrade : T.Accept,
        cancelLabel: T.Cancel,
        dialogWidth: { xs: 'calc(100vw - 32px)', md: '520px' },
        dialogMaxWidth: 'calc(100vw - 32px)',
      },
      onSubmit: isUpgradeAvailable ? submitUpgradeForm : () => true,
    })
  }
}

export default UpgradeKsClusterForm
