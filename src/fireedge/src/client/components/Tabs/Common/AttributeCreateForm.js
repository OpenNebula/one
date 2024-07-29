/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { memo, useCallback, useMemo } from 'react'

import { Box, TextField } from '@mui/material'
import { AddSquare as AddIcon } from 'iconoir-react'
import { useForm } from 'react-hook-form'

import { SubmitButton } from 'client/components/FormControl'
import { generateKey } from 'client/utils'

const AttributeCreateForm = memo(({ handleAdd }) => {
  const key = useMemo(() => generateKey(), [])
  const nameInputKey = useMemo(() => `name-${key}`, [key])
  const valueInputKey = useMemo(() => `value-${key}`, [key])

  const { handleSubmit, register, reset, formState } = useForm({
    defaultValues: { [nameInputKey]: '', [valueInputKey]: '' },
    reValidateMode: 'onSubmit',
  })

  const handleCreateAttribute = useCallback(
    async (data) => {
      try {
        const { [nameInputKey]: name, [valueInputKey]: value } = data

        if (!name || !value || formState.isSubmitting) return

        await handleAdd?.(`${name}`.toUpperCase(), `${value}`) // The field name is always in uppercase, but the value is whatever the user enters in the input
        reset()
      } catch {}
    },
    [handleAdd, formState.isSubmitting, nameInputKey, valueInputKey]
  )

  const handleKeyDown = (evt) => {
    if (evt.key === 'Enter') {
      handleSubmit(handleCreateAttribute)(evt)
    }
  }

  const handleBlur = (evt) => {
    const nextTarget = evt.relatedTarget?.name

    // If the next target isn't the name or value input, submit the form
    if (![nameInputKey, valueInputKey].includes(nextTarget)) {
      handleSubmit(handleCreateAttribute)(evt)
    }
  }

  return (
    <>
      {/* NAME ATTRIBUTE */}
      <TextField
        onKeyDown={handleKeyDown}
        disabled={formState.isSubmitting}
        inputProps={{ 'data-cy': `text-${nameInputKey}` }}
        {...register(nameInputKey, { onBlur: handleBlur })}
      />

      {/* VALUE ATTRIBUTE */}
      <Box display="inline-flex" alignItems="center">
        <TextField
          sx={{ flexGrow: 1 }}
          onKeyDown={handleKeyDown}
          disabled={formState.isSubmitting}
          inputProps={{ 'data-cy': `text-${valueInputKey}` }}
          {...register(valueInputKey, { onBlur: handleBlur })}
        />
        <SubmitButton
          data-cy={'action-add'}
          icon={<AddIcon />}
          isSubmitting={formState.isSubmitting}
          onClick={handleSubmit(handleCreateAttribute)}
        />
      </Box>
    </>
  )
})

AttributeCreateForm.propTypes = { handleAdd: PropTypes.func }
AttributeCreateForm.displayName = 'AttributeCreateForm'

export default AttributeCreateForm
