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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Divider, Typography } from '@mui/material'
import { Check, Label, Plus, Search, Settings } from 'iconoir-react'

import { ACTIONS, T } from '@ConstantsModule'
import { useAuth, useModalsApi, useViews } from '@FeaturesModule'
import { useTranslation } from '@ProvidersModule'
import { Button } from '@modules/componentsv2/primitives/Buttons/Default'
import { Checkbox } from '@modules/componentsv2/primitives/Buttons/Checkbox'
import { MenuButton } from '@modules/componentsv2/primitives/Buttons/Menu'
import { InputField } from '@modules/componentsv2/primitives/Fields/Default'
import { CreateLabelForm } from '@modules/componentsv2/composed/Forms/CreateLabelForm'
import { ManageLabels } from '@modules/componentsv2/composed/LabelPanel/ManageLabels'
import { useLabelOperations } from '@modules/componentsv2/composed/LabelPanel/hooks'
import { getPanelStyles } from '@modules/componentsv2/composed/LabelPanel/styles'
import {
  filterLabelRows,
  getLabelRows,
  getSelectedResourceIds,
} from '@modules/componentsv2/composed/LabelPanel/utils'

const hasOwn = (object, key) =>
  Object.prototype.hasOwnProperty.call(object, key)
const EMPTY_LABELS = Object.freeze({ user: {}, group: {} })

/**
 * Provides the MenuButton props used by toolbars to manage labels.
 *
 * @param {object} options - Label panel options
 * @returns {object} Labels MenuButton props
 */
export const getLabelMenuButtonProps = (options = {}) => {
  const { isDisabled = false, isIconOnly = true, ...panelProps } = options

  return {
    ...(isIconOnly && { iconOnly: <Label width="16px" height="16px" /> }),
    isDisabled,
    placeholder: T.Labels,
    value: 'labels',
    options: [
      [
        {
          renderContent: ({ onClose }) => (
            <LabelPanel {...panelProps} onClose={onClose} />
          ),
        },
      ],
    ],
    sx: (theme) => getPanelStyles(theme),
  }
}

/**
 * Named labels action used by aggregated views.
 *
 * @param {object} props - Label action props
 * @param {string} props.size - Button size
 * @returns {object} Labels menu button
 */
export const LabelButton = ({ size = 'small', ...props }) => (
  <MenuButton
    {...getLabelMenuButtonProps({ ...props, isIconOnly: false })}
    size={size}
    startIcon={<Label width="16px" height="16px" />}
  />
)

LabelButton.propTypes = {
  selectedRows: PropTypes.array,
  resourceType: PropTypes.string,
  isDisabled: PropTypes.bool,
  size: PropTypes.string,
}

const LabelSection = ({ title, rows, changes, canApply, onToggle }) => {
  const { translate } = useTranslation()

  return (
    <Box className="label-panel-section">
      <Typography className="label-panel-section-title">{title}</Typography>
      {rows.length ? (
        rows.map((row) => {
          const checked = hasOwn(changes, row.id)
            ? changes[row.id]
            : row.selection

          return (
            <Box
              key={row.id}
              className="label-panel-row"
              sx={{ pl: `${row.depth * 24}px` }}
            >
              <Checkbox
                className="label-panel-checkbox"
                size="small"
                checked={checked}
                isDisabled={!canApply || !row.editable}
                onChange={() => onToggle(row)}
              />
              <Box className="label-panel-label">
                <Box className="label-panel-dot" />
                <Box component="span" className="label-panel-label-text">
                  {row.name}
                </Box>
              </Box>
            </Box>
          )
        })
      ) : (
        <Typography className="label-panel-empty">
          {translate(T.NoLabels)}
        </Typography>
      )}
    </Box>
  )
}

LabelSection.propTypes = {
  title: PropTypes.node,
  rows: PropTypes.array,
  changes: PropTypes.object,
  canApply: PropTypes.bool,
  onToggle: PropTypes.func,
}

/**
 * Labels assignment menu with create and manage actions.
 *
 * @param {object} props - Component props
 * @param props.onClose
 * @param props.labels
 * @param props.selectedRows
 * @param props.resourceType
 * @param props.isLoading
 * @param props.onLabelsChange
 * @param props.onApply
 * @param props.onCreate
 * @param props.onEdit
 * @param props.onDelete
 * @returns {object} Label panel
 */
export const LabelPanel = ({
  onClose,
  labels: labelsProp,
  selectedRows = [],
  resourceType,
  isLoading = false,
  onLabelsChange,
  onApply,
  onCreate,
  onEdit,
  onDelete,
}) => {
  const { translate } = useTranslation()
  const auth = useAuth()
  const { showModal } = useModalsApi()
  const { getResourceView } = useViews()
  const sourceLabels = labelsProp ?? auth?.labels ?? EMPTY_LABELS
  const [labels, setLabels] = useState(sourceLabels)
  const [search, setSearch] = useState('')
  const [changes, setChanges] = useState({})
  const labelsRef = useRef(labels)
  const isMountedRef = useRef(true)
  labelsRef.current = labels
  const getCurrentLabels = useCallback(() => labelsRef.current, [])
  const selectedIds = useMemo(
    () => getSelectedResourceIds(selectedRows),
    [selectedRows]
  )
  const selectedIdsKey = selectedIds.join(',')
  const canEditLabels =
    getResourceView(resourceType)?.actions?.[ACTIONS.EDIT_LABELS] === true
  const labelRows = useMemo(
    () => getLabelRows(labels, auth, resourceType, selectedIds),
    [auth, labels, resourceType, selectedIds]
  )
  const filteredUserRows = useMemo(
    () => filterLabelRows(labelRows.user, search),
    [labelRows.user, search]
  )
  const filteredGroupRows = useMemo(
    () => filterLabelRows(labelRows.group, search),
    [labelRows.group, search]
  )
  const handleLabelsChange = useCallback(
    (nextLabels) => {
      labelsRef.current = nextLabels
      isMountedRef.current && setLabels(nextLabels)
      onLabelsChange?.(nextLabels)
    },
    [onLabelsChange]
  )
  const operations = useLabelOperations({
    getLabels: getCurrentLabels,
    auth,
    onLabelsChange: handleLabelsChange,
    onApply,
    onCreate,
    onEdit,
    onDelete,
  })
  const canApply = canEditLabels && !!resourceType && selectedIds.length > 0
  const modifiedRows = Object.entries(changes)
  const addedCount = modifiedRows.filter(([, selected]) => selected).length
  const removedCount = modifiedRows.length - addedCount
  const pendingLabel =
    addedCount && !removedCount
      ? `+${addedCount}`
      : removedCount && !addedCount
      ? `-${removedCount}`
      : `${modifiedRows.length} ${translate(T.Changes)}`
  useEffect(
    () => () => {
      isMountedRef.current = false
    },
    []
  )

  useEffect(() => setLabels(sourceLabels), [sourceLabels])

  useEffect(() => setChanges({}), [labels, resourceType, selectedIdsKey])

  const handleClose = () => {
    setSearch('')
    onClose?.()
  }

  const handleToggle = (row) => {
    if (!canEditLabels) return

    setChanges((current) => {
      const currentValue = hasOwn(current, row.id)
        ? current[row.id]
        : row.selection
      const nextValue = currentValue === null ? true : !currentValue
      const next = { ...current }

      if (nextValue === row.selection) delete next[row.id]
      else next[row.id] = nextValue

      return next
    })
  }

  const handleApply = async () => {
    if (!canEditLabels) return

    try {
      await operations.apply({
        rows: labelRows.all,
        changes,
        resourceType,
        selectedIds,
      })
      isMountedRef.current && setChanges({})
    } catch {
      // The mutation hook reports the error and pending changes stay visible.
    }
  }

  const handleOpenCreate = (row = null, shouldClosePanel = true) => {
    if (!canEditLabels) return

    shouldClosePanel && handleClose()
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

  const handleOpenManage = () => {
    if (!canEditLabels) return

    handleClose()
    showModal({
      isCustomDialog: true,
      form: ManageLabels,
      customDialogProps: {
        getLabels: getCurrentLabels,
        auth,
        onLabelsChange: handleLabelsChange,
      },
    })
  }

  const isBusy = isLoading || operations.isLoading

  return (
    <Box className="label-panel-content" aria-label={translate(T.Labels)}>
      <Typography component="h2" className="label-panel-title">
        {translate(T.Labels)}
      </Typography>
      <Divider className="label-panel-divider" />
      <InputField
        className="label-panel-search"
        placeholder={`${translate(T.SearchLabelsInput)}...`}
        startIcon={<Search width="16px" height="16px" />}
        value={search}
        inputProps={{ 'aria-label': translate(T.SearchLabelsInput) }}
        onChange={setSearch}
      />

      <Box className="label-panel-tree">
        <LabelSection
          title={translate(T.MyLabels)}
          rows={filteredUserRows}
          changes={changes}
          canApply={canApply}
          onToggle={handleToggle}
        />
        <LabelSection
          title={translate(T.GroupLabels)}
          rows={filteredGroupRows}
          changes={changes}
          canApply={canApply}
          onToggle={handleToggle}
        />
      </Box>

      {canEditLabels && modifiedRows.length > 0 && (
        <Box className="label-panel-pending">
          <Typography className="label-panel-pending-count">
            {pendingLabel}
          </Typography>
          <Box className="label-panel-pending-actions">
            <Button
              type="secondary"
              isDisabled={isBusy}
              onClick={() => setChanges({})}
            >
              {translate(T.Cancel)}
            </Button>
            <Button
              type="primary"
              startIcon={<Check />}
              isDisabled={isBusy}
              onClick={handleApply}
            >
              {translate(T.Apply)}
            </Button>
          </Box>
        </Box>
      )}

      {canEditLabels && (
        <Box className="label-panel-actions">
          <Button
            className="label-panel-action"
            type="transparent"
            startIcon={<Plus />}
            isDisabled={isBusy}
            onClick={() => handleOpenCreate()}
          >
            {translate(T.CreateNew)}
          </Button>
          <Button
            className="label-panel-action"
            type="transparent"
            startIcon={<Settings />}
            isDisabled={isBusy}
            onClick={handleOpenManage}
          >
            {translate(T.Manage)}
          </Button>
        </Box>
      )}
    </Box>
  )
}

LabelPanel.propTypes = {
  onClose: PropTypes.func,
  labels: PropTypes.object,
  selectedRows: PropTypes.array,
  resourceType: PropTypes.string,
  isLoading: PropTypes.bool,
  onLabelsChange: PropTypes.func,
  onApply: PropTypes.func,
  onCreate: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
}

LabelPanel.displayName = 'LabelPanel'

export { ManageLabels }
