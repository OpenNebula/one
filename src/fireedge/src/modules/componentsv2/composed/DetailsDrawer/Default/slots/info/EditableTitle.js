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
import PropTypes from 'prop-types'
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { InputBase } from '@mui/material'
import { getEditableTitleStyles } from '@modules/componentsv2/composed/DetailsDrawer/Default/slots/info/styles'
import { Tooltip } from '@modules/componentsv2/primitives/Tooltip'
import { useTranslation } from '@ProvidersModule'
import { T } from '@ConstantsModule'

/**
 * @param {object} root0 - Props.
 * @param {string} root0.value - Current title value.
 * @param {Function} root0.onSave - Save callback.
 * @param {boolean} root0.isDisabled - Whether title editing is disabled.
 * @returns {object} Editable title input.
 */
const EditableTitle = forwardRef(
  ({ value = '', onSave, isDisabled = false, dataCy }, ref) => {
    const { translate } = useTranslation()
    const [isEditing, setIsEditing] = useState(false)
    const [draft, setDraft] = useState(value)
    const [isSaving, setIsSaving] = useState(false)
    const inputRef = useRef(null)

    const canRename = !isDisabled && !isSaving
    const canShowRenameTooltip = canRename && !isEditing

    const startEditing = useCallback(() => {
      if (!canRename) return
      setIsEditing(true)
    }, [canRename])

    useImperativeHandle(ref, () => ({ startEditing }), [startEditing])

    useEffect(() => {
      if (!isEditing) setDraft(value)
    }, [value, isEditing])

    useEffect(() => {
      if (isEditing) inputRef.current?.focus()
    }, [isEditing])

    const clickToRename = translate(T.ClickToRename)

    const handleKeyDown = (event) => {
      if (event.key === 'Enter') save()
      if (event.key === 'Escape') cancel()
    }

    const handleChange = (event) => {
      setDraft(event.target.value)
    }

    const cancel = () => {
      setDraft(value)
      setIsEditing(false)
    }

    const save = async () => {
      const nextValue = draft.trim()
      const currentValue = value.trim()

      if (!nextValue || nextValue === currentValue) {
        cancel()

        return
      }

      setIsSaving(true)
      try {
        await onSave?.(nextValue)
        setIsEditing(false)
      } finally {
        setIsSaving(false)
      }
    }

    const titleInput = (
      <InputBase
        inputRef={inputRef}
        autoFocus={isEditing}
        className={`editable-title ${canRename ? 'editable' : ''}`}
        value={draft}
        disabled={!canRename}
        onBlur={save}
        onClick={startEditing}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        data-value={draft || ' '}
        inputProps={{
          readOnly: !isEditing,
          size: 1,
          'data-cy': dataCy,
        }}
        sx={(theme) =>
          getEditableTitleStyles({
            theme,
          })
        }
      />
    )

    return canShowRenameTooltip ? (
      <Tooltip title={clickToRename} placement="bottom" followCursor>
        {titleInput}
      </Tooltip>
    ) : (
      titleInput
    )
  }
)

EditableTitle.propTypes = {
  value: PropTypes.string,
  onSave: PropTypes.func,
  isDisabled: PropTypes.bool,
  dataCy: PropTypes.string,
}

EditableTitle.displayName = 'EditableTitle'

export default EditableTitle
