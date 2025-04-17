/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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

import { T, STYLE_BUTTONS } from '@ConstantsModule'
import SubmitButton from '@modules/components/FormControl/SubmitButton'
import PropTypes from 'prop-types'
import { Component, useState, useEffect } from 'react'
import {
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  RadioGroup,
  Radio,
  MenuItem,
  Typography,
} from '@mui/material'

/**
 * Add label dialog.
 *
 * @param {object} props - Component props
 * @param {boolean} props.open - Open/Close dialog
 * @param {Function} props.onClose - On dialog close
 * @param {Function} props.onSubmit - On submit callback
 * @param {string} props.parentNodeId - Optional parent node ID to nest the new label under
 * @param {string} props.addLabelType - Type of label being added "user"/"group"
 * @param {object} props.groupIdMap - Map of group names to IDs
 * @param {Array} props.groups - Array of available groups to choose from
 * @param {boolean} props.isLoading - Flag to show loading state
 * @returns {Component} The rendered dialog component
 */
const AddLabelDialog = ({
  open,
  onClose,
  onSubmit,
  parentNodeId,
  addLabelType,
  groupIdMap = {},
  groups = [],
  isLoading = false,
}) => {
  const isRootAdd = !parentNodeId
  const [name, setName] = useState('')
  const [type, setType] = useState('user')
  const [groupId, setGroupId] = useState('')

  useEffect(() => {
    if (open) {
      setName('')
      setType('user')
      setGroupId('')
    }
  }, [open])

  const handleSubmit = () => {
    const fType = addLabelType != null && !isRootAdd ? addLabelType : type
    const gId =
      fType === 'group'
        ? isRootAdd
          ? groupId
          : groupIdMap?.[parentNodeId?.split('/')?.[0]]
        : null
    const fParentNodeId =
      gId != null && gId !== ''
        ? parentNodeId?.split('/')?.slice(1)?.join('/')
        : parentNodeId

    onSubmit({
      name: name.trim(),
      parentNodeId: fParentNodeId,
      type: fType,
      groupId: gId,
    })
  }

  let parentDisplayInfo = ''
  if (!isRootAdd && parentNodeId) {
    const parts = parentNodeId.split('/')
    const immediateParentName =
      parts.length > 1 ? parts[parts?.length - 1].replace(/\$/g, '') : T.Root
    parentDisplayInfo = `${T.Parent}: ${immediateParentName}`
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        zIndex: (theme) => theme?.zIndex?.modal + 10,
      }}
    >
      <DialogTitle>{T.AddNewLabel}</DialogTitle>
      <DialogContent>
        {!isRootAdd && parentNodeId && (
          <DialogContentText sx={{ mb: 2 }}>
            {parentDisplayInfo}
            <br />
            <Typography variant="caption" color="textSecondary">
              {T.FullPath}: {parentNodeId}
            </Typography>
          </DialogContentText>
        )}
        {isRootAdd && (
          <DialogContentText sx={{ mb: 2 }}>
            {T.AddNewRootLabelConcept}
          </DialogContentText>
        )}

        <TextField
          autoFocus
          margin="dense"
          label={T.NewLabelName}
          inputProps={{ 'data-cy': 'text-new-user-label' }}
          type="text"
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => {
            const rawValue = e.target.value
            const alphanumericOnly = rawValue.replace(/[^a-zA-Z0-9]/g, '')
            setName(alphanumericOnly)
          }}
          required
          disabled={isLoading}
        />

        {isRootAdd && (
          <>
            <FormControl
              component="fieldset"
              margin="normal"
              disabled={isLoading}
            >
              <RadioGroup
                row
                name="label-type"
                value={type}
                onChange={(e) => {
                  setType(e.target.value)
                  if (e.target.value === 'user') {
                    setGroupId('')
                  }
                }}
              >
                <FormControlLabel
                  value="user"
                  control={
                    <Radio inputProps={{ 'data-cy': 'radio-user-label' }} />
                  }
                  label={`${T.User} ${T.Label}`}
                />
                <FormControlLabel
                  value="group"
                  control={
                    <Radio inputProps={{ 'data-cy': 'radio-group-label' }} />
                  }
                  label={`${T.Group} ${T.Label}`}
                />
              </RadioGroup>
            </FormControl>

            {type === 'group' && (
              <FormControl
                fullWidth
                margin="normal"
                required
                disabled={isLoading}
              >
                <InputLabel>{T.SelectGroup}</InputLabel>
                <Select
                  data-cy={'select-group-label'}
                  value={groupId}
                  label={T.SelectGroup}
                  onChange={(e) => setGroupId(e.target.value)}
                  MenuProps={{
                    disablePortal: true,
                  }}
                >
                  {!groups || groups.length === 0 ? (
                    <MenuItem disabled value="">
                      <em>{T.NoDataAvailable}</em>
                    </MenuItem>
                  ) : (
                    groups.map((group) => (
                      <MenuItem
                        key={group.ID}
                        value={group.ID}
                        data-cy={'select-' + group.NAME}
                      >
                        {group.NAME}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <SubmitButton
          type={STYLE_BUTTONS.TYPE.NOBORDER}
          onClick={onClose}
          disabled={isLoading}
          isSubmitting={isLoading}
          label={T.Cancel}
        />
        <SubmitButton
          data-cy={'label-create-accept'}
          onClick={handleSubmit}
          size={STYLE_BUTTONS.SIZE.MEDIUM}
          type={STYLE_BUTTONS.TYPE.FILLED}
          importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
          label={T.CreateLabel}
          isSubmitting={isLoading}
          disabled={
            isLoading ||
            !name.trim() ||
            (isRootAdd && type === 'group' && !groupId)
          }
        />
      </DialogActions>
    </Dialog>
  )
}

AddLabelDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  parentNodeId: PropTypes.string,
  groups: PropTypes.arrayOf(
    PropTypes.shape({
      ID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      NAME: PropTypes.string.isRequired,
    })
  ),
  groupIdMap: PropTypes.object,
  addLabelType: PropTypes.string,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
}

export default AddLabelDialog
