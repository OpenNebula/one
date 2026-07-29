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
import { Component, useCallback } from 'react'
import { useModalsApi } from '@FeaturesModule'
import PropTypes from 'prop-types'
import { SubmitButton } from '@ComponentsV2Module'
import { Settings, Check, Plus, Filter } from 'iconoir-react'
import { T, STYLE_BUTTONS, LABEL_DELIMITER, PATH } from '@ConstantsModule'
import { useLabelMutations } from '@modules/resources/resources/Settings/NestedLabelTree/handlers'
import { useHistory } from 'react-router'
import { CreateForm as CreateLabelForm } from '@modules/resources/resources/Settings/Forms'
import { LABEL_COLUMN_ID } from '@modules/resources/resources/Settings/constants'

/**
 * Renders a smart submit button depending on selection and tree state.
 *
 * @param {object} params - Props
 * @param {object} params.treeState - Current tree state
 * @param {boolean} params.treeModified - Is tree modified
 * @param {object} params.info - Tree info
 * @param {boolean} params.applyingLabels - Applying state
 * @param {Function} params.applyLabels - Apply handler
 * @param {Function} params.resetInitialState - Reset tree state hook
 * @param {Function} params.getModifiedPaths - Modified paths func
 * @param {string} params.resourceType - Table resource type
 * @param {Function} params.closeParent - Callback to close parent dropdown
 * @param {Function} params.setFilter - Callback to set table filter
 * @returns {Component} - Smart submit button
 */
const SmartActionButton = ({
  treeState,
  treeModified,
  info,
  applyingLabels,
  applyLabels,
  resetInitialState,
  getModifiedPaths,
  resourceType,
  closeParent,
  setFilter,
}) => {
  if (!resourceType) return null
  const [{ addLabel }] = useLabelMutations()
  const history = useHistory()
  const { showModal } = useModalsApi()

  const hasSelection = info?.rowIds?.length > 0

  const handleApply = async () => {
    await applyLabels({
      state: treeState,
      info: { ...info, modifiedPaths: getModifiedPaths() },
    })
    resetInitialState()
  }

  const handleSubmit = useCallback(
    async (data) => {
      await addLabel({ formData: data, state: treeState, info: info })
    },
    [addLabel, treeState, info]
  )
  const handleOpenLabelsTab = () => {
    history.push(PATH.SETTINGS)
  }

  const handleCreateLabel = () => {
    closeParent?.()
    showModal({
      id: 'create-label',
      dialogProps: {
        title: T.CreateLabel,
        dataCy: 'modal-create-label',
        fixedWidth: '500px',
        fixedHeight: '500px',
      },
      form: CreateLabelForm,
      onSubmit: handleSubmit,
    })
  }

  const handleFilter = () => {
    const stripType = (s) => s?.split('.')?.slice(1)?.join(LABEL_DELIMITER)

    setFilter(LABEL_COLUMN_ID, getModifiedPaths()?.map(stripType) ?? [])
  }

  return (
    <>
      {hasSelection ? (
        treeModified || applyingLabels ? (
          <SubmitButton
            data-cy="apply-selected-all"
            iconOnly={<Check />}
            isSubmitting={applyingLabels}
            loadOnIcon
            onClick={handleApply}
            type={STYLE_BUTTONS.TYPE.PRIMARY}
            label={T.Apply}
          />
        ) : (
          <SubmitButton
            data-cy={'create-label'}
            iconOnly={<Plus />}
            label={T.CreateLabel}
            type={STYLE_BUTTONS.TYPE.PRIMARY}
            loadOnIcon
            onClick={handleCreateLabel}
          />
        )
      ) : (
        <SubmitButton
          data-cy="filter-selected-labels"
          iconOnly={<Filter />}
          loadOnIcon
          disabled={!treeModified}
          onClick={handleFilter}
          type={STYLE_BUTTONS.TYPE.PRIMARY}
          label={T.Filter}
        />
      )}
      {(!treeModified || !hasSelection) && (
        <SubmitButton
          data-cy="manage-labels"
          iconOnly={<Settings />}
          onClick={handleOpenLabelsTab}
          type={STYLE_BUTTONS.TYPE.SECONDARY}
          tooltip={T.ManageLabels}
        />
      )}
    </>
  )
}

SmartActionButton.propTypes = {
  treeState: PropTypes.object,
  treeModified: PropTypes.bool,
  info: PropTypes.object,
  applyingLabels: PropTypes.bool,
  applyLabels: PropTypes.func,
  resetInitialState: PropTypes.func,
  getModifiedPaths: PropTypes.func,
  resourceType: PropTypes.string,
  closeParent: PropTypes.func,
  setFilter: PropTypes.func,
}

export default SmartActionButton
