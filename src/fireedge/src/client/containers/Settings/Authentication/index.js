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
import { ReactElement, useMemo, memo, useState } from 'react'
import PropTypes from 'prop-types'
import {
  Paper,
  Stack,
  IconButton,
  Typography,
  Skeleton,
  TextField,
} from '@mui/material'
import { Edit } from 'iconoir-react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

import { useAuth } from 'client/features/Auth'
import { useUpdateUserMutation } from 'client/features/OneApi/user'
import { useGeneralApi } from 'client/features/General'

import {
  FIELDS,
  SCHEMA,
} from 'client/containers/Settings/Authentication/schema'
import { Translate } from 'client/components/HOC'
import { Legend } from 'client/components/Forms'
import { jsonToXml } from 'client/models/Helper'
import { sanitize } from 'client/utils'
import { T } from 'client/constants'

/** @returns {ReactElement} Settings authentication */
const Settings = () => (
  <Paper variant="outlined" sx={{ py: '1.5em' }}>
    <Stack gap="1em">
      {FIELDS.map((field) => (
        <FieldComponent
          key={'settings-authentication-field-' + field.name}
          field={field}
        />
      ))}
    </Stack>
  </Paper>
)

const FieldComponent = memo(({ field }) => {
  const [isEnabled, setIsEnabled] = useState(false)
  const { name, label, tooltip } = field

  const { user, settings } = useAuth()
  const [updateUser, { isLoading }] = useUpdateUserMutation()
  const { enqueueError } = useGeneralApi()

  const defaultValues = useMemo(() => SCHEMA.cast(settings), [settings])

  const { watch, register, reset } = useForm({
    reValidateMode: 'onSubmit',
    defaultValues,
    resolver: yupResolver(SCHEMA),
  })

  const sanitizedValue = useMemo(() => sanitize`${watch(name)}`, [isEnabled])

  const handleUpdateUser = async () => {
    try {
      if (isLoading || !isEnabled) return

      const castedData = SCHEMA.cast(watch(), { isSubmit: true })
      const template = jsonToXml(castedData)

      updateUser({ id: user.ID, template })
      setIsEnabled(false)
    } catch {
      enqueueError(T.SomethingWrong)
    }
  }

  const handleBlur = () => {
    handleUpdateUser()
  }

  const handleKeyDown = (evt) => {
    if (evt.key === 'Escape') {
      reset(defaultValues)
      setIsEnabled(false)
      evt.stopPropagation()
    }

    if (evt.key === 'Enter') {
      handleUpdateUser()
    }
  }

  return (
    <Stack component="fieldset" sx={{ minInlineSize: 'auto' }}>
      <Legend title={label} tooltip={tooltip} />
      {isEnabled ? (
        <>
          <TextField
            fullWidth
            autoFocus
            multiline
            rows={5}
            variant="outlined"
            onKeyDown={handleKeyDown}
            helperText={<Translate word={T.PressEscapeToCancel} />}
            {...register(field.name, { onBlur: handleBlur })}
          />
        </>
      ) : (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          gap="1em"
          paddingX={1}
        >
          {isLoading ? (
            <>
              <Skeleton variant="text" width="100%" height={36} />
              <Skeleton variant="circular" width={28} height={28} />
            </>
          ) : (
            <>
              <Typography noWrap title={sanitizedValue}>
                {sanitizedValue}
              </Typography>
              <IconButton onClick={() => setIsEnabled(true)}>
                <Edit />
              </IconButton>
            </>
          )}
        </Stack>
      )}
    </Stack>
  )
})

FieldComponent.propTypes = {
  field: PropTypes.object.isRequired,
}

FieldComponent.displayName = 'FieldComponent'

export default Settings
