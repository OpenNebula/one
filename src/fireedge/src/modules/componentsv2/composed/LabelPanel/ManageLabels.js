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
/* eslint-disable jsdoc/require-param-description, jsdoc/require-param-type */

import PropTypes from 'prop-types'
import { useCallback, useEffect, useRef, useState } from 'react'

import { T } from '@ConstantsModule'
import { useAuth, useModalsApi } from '@FeaturesModule'
import { CreateLabelForm } from '@modules/componentsv2/composed/Forms/CreateLabelForm'
import { ManageLabelForm } from '@modules/componentsv2/composed/Forms/ManageLabelForm'
import { ResourceActionConfirmation } from '@modules/componentsv2/composed/ResourceActionConfirmation'
import { useLabelOperations } from '@modules/componentsv2/composed/LabelPanel/hooks'

const EMPTY_LABELS = Object.freeze({ user: {}, group: {} })

/**
 * Shared manager for the labels dialog and the Profile Settings tab.
 *
 * @param {object} props - Manager props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {object} props.labels - Current labels
 * @param {Function} props.getLabels - Current labels getter
 * @param {object} props.auth - Authenticated user data
 * @param {boolean} props.isEmbedded - Renders as settings content
 * @param {Function} props.onClose - Close callback
 * @param {Function} props.onLabelsChange - Labels change callback
 * @param {Function} props.onCreate - Create callback
 * @param {Function} props.onEdit - Edit callback
 * @param {Function} props.onDelete - Delete callback
 * @returns {object} Labels manager
 */
export const ManageLabels = ({
  open = true,
  labels: labelsProp,
  getLabels: getLabelsProp,
  auth: authProp,
  isEmbedded = false,
  onClose,
  onLabelsChange,
  onCreate,
  onEdit,
  onDelete,
}) => {
  const currentAuth = useAuth()
  const auth = authProp ?? currentAuth
  const { showModal } = useModalsApi()
  const sourceLabels = labelsProp ?? auth?.labels ?? EMPTY_LABELS
  const [labels, setLabels] = useState(sourceLabels)
  const labelsRef = useRef(labels)
  labelsRef.current = labels

  useEffect(() => setLabels(sourceLabels), [sourceLabels])

  const getCurrentLabels = useCallback(
    () => getLabelsProp?.() ?? labelsRef.current,
    [getLabelsProp]
  )
  const handleLabelsChange = useCallback(
    (nextLabels) => {
      labelsRef.current = nextLabels
      setLabels(nextLabels)
      onLabelsChange?.(nextLabels)
    },
    [onLabelsChange]
  )
  const operations = useLabelOperations({
    getLabels: getCurrentLabels,
    auth,
    onLabelsChange: handleLabelsChange,
    onCreate,
    onEdit,
    onDelete,
  })

  const handleOpenCreate = (row = null) => {
    showModal({
      isCustomDialog: true,
      form: CreateLabelForm,
      customDialogProps: { getLabels: getCurrentLabels, auth, row },
      onSubmit: async (formData) => {
        try {
          return row
            ? await operations.edit(row, formData)
            : await operations.create(formData)
        } catch {
          return false
        }
      },
    })
  }

  const handleDelete = (row, onDeleted) => {
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T.DeleteLabel,
        description: (
          <ResourceActionConfirmation
            description={T.DeleteLabelConcept}
            resources={{ name: row.displayPath }}
            resourceType={T.Labels}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: { isDestructive: true },
      },
      onSubmit: async () => {
        try {
          const nextLabels = await operations.remove(row)

          onDeleted?.(nextLabels)

          return nextLabels
        } catch {
          return false
        }
      },
    })
  }

  return (
    <ManageLabelForm
      open={open}
      labels={labels}
      getLabels={getCurrentLabels}
      auth={auth}
      isEmbedded={isEmbedded}
      isLoading={operations.isLoading}
      onClose={onClose}
      onCreate={handleOpenCreate}
      onEdit={handleOpenCreate}
      onDelete={handleDelete}
    />
  )
}

ManageLabels.propTypes = {
  open: PropTypes.bool,
  labels: PropTypes.object,
  getLabels: PropTypes.func,
  auth: PropTypes.object,
  isEmbedded: PropTypes.bool,
  onClose: PropTypes.func,
  onLabelsChange: PropTypes.func,
  onCreate: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
}

ManageLabels.displayName = 'ManageLabels'
