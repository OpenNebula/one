/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement, useMemo, useCallback } from 'react'
import TrashIcon from 'iconoir-react/dist/Trash'
import { Paper, Stack, Box, Typography, TextField } from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'
import { useForm } from 'react-hook-form'

import { useAuth } from 'client/features/Auth'
import { useUpdateUserMutation } from 'client/features/OneApi/user'
import { useGeneralApi } from 'client/features/General'
import { useSearch } from 'client/hooks'

import { StatusChip } from 'client/components/Status'
import { SubmitButton } from 'client/components/FormControl'
import { jsonToXml, getColorFromString } from 'client/models/Helper'
import { Translate, Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const NEW_LABEL_ID = 'new-label'

/**
 * Section to change labels.
 *
 * @returns {ReactElement} Settings configuration UI
 */
const Settings = () => {
  const { user, settings } = useAuth()
  const { enqueueError } = useGeneralApi()
  const [updateUser, { isLoading }] = useUpdateUserMutation()

  const currentLabels = useMemo(
    () => settings?.LABELS?.split(',').filter(Boolean) ?? [],
    [settings?.LABELS]
  )

  const { handleSubmit, register, reset, setFocus } = useForm({
    reValidateMode: 'onSubmit',
  })

  const { result, handleChange } = useSearch({
    list: currentLabels,
    listOptions: { distance: 50 },
    wait: 500,
    condition: !isLoading,
  })

  const handleAddLabel = useCallback(
    async (newLabel) => {
      try {
        const exists = currentLabels.some((label) => label === newLabel)

        if (exists) throw new Error(T.LabelAlreadyExists)

        const newLabels = currentLabels.concat(newLabel).join()
        const template = jsonToXml({ LABELS: newLabels })
        await updateUser({ id: user.ID, template, replace: 1 })
      } catch (error) {
        enqueueError(error.message ?? T.SomethingWrong)
      } finally {
        // Reset the search after adding the label
        handleChange()
        reset({ [NEW_LABEL_ID]: '' })
        setFocus(NEW_LABEL_ID)
      }
    },
    [updateUser, currentLabels, handleChange, reset]
  )

  const handleDeleteLabel = useCallback(
    async (label) => {
      try {
        const newLabels = currentLabels.filter((l) => l !== label).join()
        const template = jsonToXml({ LABELS: newLabels })
        await updateUser({ id: user.ID, template, replace: 1 })

        // Reset the search after deleting the label
        handleChange()
      } catch {
        enqueueError(T.SomethingWrong)
      }
    },
    [updateUser, currentLabels, handleChange]
  )

  const handleKeyDown = useCallback(
    (evt) => {
      if (evt.key !== 'Enter') return

      handleSubmit(async (formData) => {
        const newLabel = formData[NEW_LABEL_ID]

        if (newLabel) await handleAddLabel(newLabel)

        // scroll to the new label (if it exists)
        setTimeout(() => {
          document
            ?.querySelector(`[data-cy='${newLabel}']`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 500)
      })(evt)
    },
    [handleAddLabel, handleSubmit]
  )

  return (
    <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box mt="0.5rem" p="1rem">
        <Typography variant="underline">
          <Translate word={T.Labels} />
        </Typography>
      </Box>
      <Stack height={1} gap="0.5rem" p="0.5rem 1rem" overflow="auto">
        {result?.map((label) => (
          <Stack key={label} direction="row" alignItems="center">
            <Box flexGrow={1}>
              <StatusChip
                dataCy={label}
                text={label}
                stateColor={getColorFromString(label)}
              />
            </Box>
            <SubmitButton
              data-cy={`delete-label-${label}`}
              disabled={isLoading}
              onClick={() => handleDeleteLabel(label)}
              icon={<TrashIcon />}
            />
          </Stack>
        ))}
      </Stack>
      <TextField
        sx={{ flexGrow: 1, p: '0.5rem 1rem' }}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        placeholder={Tr(T.NewLabelOrSearch)}
        inputProps={{ 'data-cy': NEW_LABEL_ID }}
        InputProps={{
          endAdornment: isLoading ? (
            <CircularProgress color="secondary" size={14} />
          ) : undefined,
        }}
        {...register(NEW_LABEL_ID, { onChange: handleChange })}
        helperText={'Press enter to create a new label'}
      />
    </Paper>
  )
}

export default Settings
