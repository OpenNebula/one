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
import { StatusChip, SubmitButton, Tr, Translate } from '@ComponentsModule'
import { STYLE_BUTTONS, T } from '@ConstantsModule'
import { AuthAPI, useAuth, useGeneralApi } from '@FeaturesModule'
import { useSearch } from '@HooksModule'
import { getColorFromString } from '@ModelsModule'
import { useSettingWrapper } from '@modules/containers/Settings/Wrapper'
import { Box, Stack, TextField, Typography, styled } from '@mui/material'
import TrashIcon from 'iconoir-react/dist/Trash'
import { ReactElement, useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'

const NEW_LABEL_ID = 'new-label'

const LabelWrapper = styled(Box)(({ theme, ownerState }) => ({
  display: 'flex',
  direction: 'row',
  alignItems: 'center',
  padding: `${theme.typography.pxToRem(8)} 0`,
  borderBottom: `1px solid ${theme.palette.grey[300]}`,
  animation: ownerState.highlight ? 'highlight 2s ease-in-out' : undefined,
  '@keyframes highlight': {
    from: { backgroundColor: 'yellow' },
    to: { backgroundColor: 'transparent' },
  },
}))

/**
 * Section to change labels.
 *
 * @returns {ReactElement} Settings configuration UI
 */
export const Settings = () => {
  const { Legend, InternalWrapper } = useSettingWrapper()
  const { labels } = useAuth()
  const { enqueueError } = useGeneralApi()
  const [removeLabel, { isLoading: removeLoading }] =
    AuthAPI.useRemoveLabelMutation()
  const [addLabel, { isLoading, data, isSuccess }] =
    AuthAPI.useAddLabelMutation()

  const { handleSubmit, register, reset, setFocus } = useForm({
    reValidateMode: 'onSubmit',
  })

  const { result, handleChange } = useSearch({
    list: labels,
    listOptions: { threshold: 0.2 },
    wait: 400,
    condition: !isLoading,
  })

  useEffect(() => {
    if (!isSuccess) return

    setTimeout(() => {
      // scroll to the new label (if it exists)
      document
        ?.querySelector(`[data-cy='${data}']`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 450)
  }, [isSuccess])

  const handleAddLabel = useCallback(
    async (formData, event) => {
      event?.preventDefault()
      event?.stopPropagation()

      try {
        await addLabel({ newLabel: formData[NEW_LABEL_ID] }).unwrap()
      } catch (error) {
        enqueueError(error.message ?? T.SomethingWrong)
      } finally {
        // Reset the search after adding the label
        handleChange()
        reset({ [NEW_LABEL_ID]: '' })
        setFocus(NEW_LABEL_ID)
      }
    },
    [addLabel, handleChange, reset]
  )

  const handleDeleteLabel = useCallback(
    async (label) => {
      try {
        await removeLabel({ label }).unwrap()
      } catch (error) {
        enqueueError(error.message ?? T.SomethingWrong)
      }
    },
    [removeLabel, handleChange]
  )

  return (
    <Box>
      <Legend title={T.Labels} />
      <InternalWrapper title={T.Labels}>
        <Box display="flex" gap="0.5rem" alignItems="center">
          <TextField
            sx={{ flexGrow: 1, p: '0.5rem 1rem' }}
            disabled={isLoading}
            placeholder={Tr(T.NewLabelOrSearch)}
            inputProps={{ 'data-cy': NEW_LABEL_ID }}
            {...register(NEW_LABEL_ID, { onChange: handleChange })}
          />
          <SubmitButton
            disabled={isLoading}
            onClick={handleSubmit(handleAddLabel)}
            importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
            size={STYLE_BUTTONS.SIZE.MEDIUM}
            type={STYLE_BUTTONS.TYPE.FILLED}
            data-cy="create-label"
            label={T.CreateLabel}
          />
        </Box>

        <Stack gap="0.5rem" p="0.5rem" overflow="auto">
          {labels.length === 0 && (
            <Typography variant="subtitle2" align="center">
              <Translate word={T.NoLabelsOnList} />
            </Typography>
          )}
          {result?.map((label) => (
            <LabelWrapper
              key={label}
              data-cy={`wrapper-${label}`}
              // highlight the label when it is added
              ownerState={{ highlight: data === label }}
            >
              <Box display="inline-flex" flexGrow={1} width="80%">
                <StatusChip
                  noWrap
                  dataCy={label}
                  text={label}
                  stateColor={getColorFromString(label)}
                />
              </Box>
              <SubmitButton
                data-cy={`delete-label-${label}`}
                disabled={removeLoading}
                onClick={() => handleDeleteLabel(label)}
                icon={<TrashIcon />}
              />
            </LabelWrapper>
          ))}
        </Stack>
      </InternalWrapper>
    </Box>
  )
}
