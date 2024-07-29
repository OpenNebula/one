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
import { ReactElement, memo, useState, useEffect } from 'react'
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
import { useForm, FormProvider, useFormContext } from 'react-hook-form'

import { useAuth } from 'client/features/Auth'
import { useUpdateUserMutation } from 'client/features/OneApi/user'
import { useGeneralApi } from 'client/features/General'

import { Translate } from 'client/components/HOC'
import { Legend } from 'client/components/Forms'
import { jsonToXml } from 'client/models/Helper'
import { sanitize } from 'client/utils'
import { T } from 'client/constants'

const FIELDS = [
  {
    name: 'SSH_PUBLIC_KEY',
    label: T.SshPublicKey,
    tooltip: T.AddUserSshPublicKey,
  },
  {
    name: 'SSH_PRIVATE_KEY',
    label: T.SshPrivateKey,
    tooltip: T.AddUserSshPrivateKey,
  },
  {
    name: 'SSH_PASSPHRASE',
    label: T.SshPassphraseKey,
    tooltip: T.AddUserSshPassphraseKey,
  },
]

const removeProperty = (propKey, { [propKey]: _, ...rest }) => rest

// -------------------------------------
// FIELD COMPONENT
// -------------------------------------

const FieldComponent = memo(
  ({ field, defaultValue, onSubmit, setIsEnabled }) => {
    const { register, reset, handleSubmit } = useFormContext()
    const { name } = field

    useEffect(() => {
      reset({ [name]: defaultValue })
    }, [defaultValue])

    const handleKeyDown = (evt) => {
      if (evt.key === 'Escape') {
        setIsEnabled(false)
        reset({ [name]: defaultValue })
        evt.stopPropagation()
      }

      if (evt.key === 'Enter') {
        handleSubmit(onSubmit)(evt)
      }
    }

    const handleBlur = (evt) => handleSubmit(onSubmit)(evt)

    return (
      <TextField
        fullWidth
        autoFocus
        multiline
        rows={5}
        defaultValue={defaultValue}
        variant="outlined"
        onKeyDown={handleKeyDown}
        helperText={<Translate word={T.PressEscapeToCancel} />}
        inputProps={{ 'data-cy': `settings-ui-text-${name}` }}
        {...register(name, { onBlur: handleBlur, shouldUnregister: true })}
      />
    )
  }
)

FieldComponent.propTypes = {
  field: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  setIsEnabled: PropTypes.func.isRequired,
  defaultValue: PropTypes.string,
}

FieldComponent.displayName = 'FieldComponent'

// -------------------------------------
// STATIC COMPONENT
// -------------------------------------

const StaticComponent = memo(
  ({ field, defaultValue, isEnabled, setIsEnabled }) => {
    const { formState } = useFormContext()
    const { name, tooltip } = field

    return (
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        gap="1em"
        paddingX={1}
      >
        {formState.isSubmitting ? (
          <>
            <Skeleton variant="text" width="100%" height={36} />
            <Skeleton variant="circular" width={28} height={28} />
          </>
        ) : (
          <>
            <Typography
              noWrap
              title={sanitize`${defaultValue}`}
              color="text.secondary"
            >
              {sanitize`${defaultValue}` || <Translate word={tooltip} />}
            </Typography>

            <IconButton
              disabled={isEnabled && !isEnabled?.[name]}
              onClick={() => setIsEnabled({ [name]: true })}
            >
              <Edit />
            </IconButton>
          </>
        )}
      </Stack>
    )
  }
)

StaticComponent.propTypes = {
  field: PropTypes.object.isRequired,
  isEnabled: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  setIsEnabled: PropTypes.func.isRequired,
  defaultValue: PropTypes.string,
}

StaticComponent.displayName = 'StaticComponent'

/**
 * Section to change user settings about SSH keys and passphrase.
 *
 * @returns {ReactElement} Settings authentication
 */
const Settings = () => {
  const [isEnabled, setIsEnabled] = useState(false)
  const { user, settings } = useAuth()
  const { enqueueError } = useGeneralApi()
  const [updateUser] = useUpdateUserMutation()

  const { ...methods } = useForm({ reValidateMode: 'onSubmit' })

  const handleUpdateUser = async (formData) => {
    try {
      setIsEnabled(false)

      const newSettings = FIELDS.reduce(
        (result, { name }) =>
          result[name] === '' ? removeProperty(name, result) : result,
        { ...settings, ...formData }
      )

      const template = jsonToXml(newSettings)

      await updateUser({ id: user.ID, template, replace: 0 })
    } catch {
      isEnabled && setIsEnabled(false)
      enqueueError(T.SomethingWrong)
    }
  }

  return (
    <Paper
      variant="outlined"
      sx={{ overflow: 'auto', py: '1.5em', gridColumn: { md: 'span 1' } }}
    >
      <FormProvider {...methods}>
        <Stack gap="1em">
          {FIELDS.map((field) => (
            <Stack
              component="fieldset"
              key={'settings-authentication-field-' + field.name}
              sx={{ minInlineSize: 'auto' }}
              data-cy={`settings-ui-${field.name}`}
            >
              <Legend title={field.label} />
              {isEnabled[field.name] ? (
                <FieldComponent
                  field={field}
                  defaultValue={settings[field.name]}
                  onSubmit={handleUpdateUser}
                  setIsEnabled={setIsEnabled}
                />
              ) : (
                <StaticComponent
                  field={field}
                  defaultValue={settings[field.name]}
                  isEnabled={isEnabled}
                  setIsEnabled={setIsEnabled}
                />
              )}
            </Stack>
          ))}
        </Stack>
      </FormProvider>
    </Paper>
  )
}

export default Settings
