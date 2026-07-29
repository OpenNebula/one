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
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement, useCallback, useRef, useState } from 'react'
import { Checkbox, ResourceActionConfirmation } from '@ComponentsV2Module'
import { T } from '@ConstantsModule'
import { useModalsApi } from '@FeaturesModule'

/**
 * Renders the confirmation content for deleting OneKs clusters.
 *
 * @param {object} props - Props
 * @param {object|object[]} props.resources - Affected clusters
 * @param {Function} props.onForceChange - Force option change handler
 * @returns {ReactElement} Confirmation content
 */
const DeleteKsClusterForm = ({ resources, onForceChange }) => {
  const [isForced, setIsForced] = useState(false)

  const handleForceChange = (force) => {
    setIsForced(force)
    onForceChange(force)
  }

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <ResourceActionConfirmation
        description={T['resource.delete.confirmation']}
        resources={resources}
        resourceType={T.KubernetesClusters}
      />
      <Checkbox
        text={T.Force}
        checked={isForced}
        onChange={handleForceChange}
      />
    </Box>
  )
}

DeleteKsClusterForm.propTypes = {
  resources: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  onForceChange: PropTypes.func.isRequired,
}

DeleteKsClusterForm.displayName = 'DeleteKsClusterForm'

/**
 * Returns a modal opener for deleting OneKs clusters.
 *
 * @returns {Function} Delete confirmation modal opener
 */
export const useDeleteKsClusterConfirmation = () => {
  const { showModal } = useModalsApi()
  const forceDelete = useRef(false)
  const handleForceChange = useCallback((isForced) => {
    forceDelete.current = isForced
  }, [])

  return ({ title, resources, onSubmit }) => {
    forceDelete.current = false

    return showModal({
      isConfirmDialog: true,
      dialogProps: {
        title,
        dataCy: 'modal-delete-oneks',
        description: (
          <DeleteKsClusterForm
            resources={resources}
            onForceChange={handleForceChange}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: () => onSubmit(forceDelete.current),
    })
  }
}

export default DeleteKsClusterForm
