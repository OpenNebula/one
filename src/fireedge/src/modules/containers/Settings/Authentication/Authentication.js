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
import { css } from '@emotion/css'
import { UserAPI, useAuth, useGeneralApi } from '@FeaturesModule'
import { SubmitButton } from '@modules/components/FormControl'
import { useSettingWrapper } from '@modules/containers/Settings/Wrapper'
import {
  Box,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import { Edit } from 'iconoir-react'
import PropTypes from 'prop-types'
import { ReactElement, memo, useEffect, useMemo, useState } from 'react'
import { FormProvider, useForm, useFormContext } from 'react-hook-form'

import { Translate } from '@ComponentsModule'
import { T } from '@ConstantsModule'
import { jsonToXml } from '@ModelsModule'
import { sanitize } from '@UtilsModule'

const styles = ({ typography }) => ({
  field: css({
    padding: 0,
    margin: 0,
    minInlineSize: 'auto',
  }),
  staticField: css({
    display: 'inline-flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'start',
    gap: typography.pxToRem(16),
    width: '100%',
  }),
  textField: css({
    flexGrow: 1,
    '& > p': {
      whiteSpace: 'normal',
      wordBreak: 'break-all',
      overflowWrap: 'break-word',
      maxWidth: '100%',
    },
  }),
})

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

export const StaticComponent = memo(
  ({ field, defaultValue, isEnabled, setIsEnabled }) => {
    const theme = useTheme()
    const classes = useMemo(() => styles(theme), [theme])

    const { formState } = useFormContext()
    const { name, tooltip } = field

    return (
      <Stack className={classes.staticField}>
        {formState.isSubmitting ? (
          <>
            <Skeleton variant="text" width="100%" height={36} />
            <Skeleton variant="circular" width={28} height={28} />
          </>
        ) : (
          <>
            <Box className={classes.textField}>
              <Typography
                title={sanitize`${defaultValue}`}
                color="text.secondary"
              >
                {sanitize`${defaultValue}` || <Translate word={tooltip} />}
              </Typography>
            </Box>
            <SubmitButton
              icon={<Edit />}
              onClick={() => setIsEnabled({ [name]: true })}
              disabled={isEnabled && !isEnabled?.[name]}
            />
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
export const Settings = () => {
  const { Legend, InternalWrapper } = useSettingWrapper()
  const theme = useTheme()
  const classes = useMemo(() => styles(theme), [theme])
  const [isEnabled, setIsEnabled] = useState(false)
  const { user, settings } = useAuth()
  const { enqueueError } = useGeneralApi()
  const [updateUser] = UserAPI.useUpdateUserMutation()

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
    <Box>
      <Legend title={T.SshKey} />
      <FormProvider {...methods}>
        <Stack gap="1em">
          {FIELDS.map((field) => (
            <Stack
              component="fieldset"
              key={'settings-authentication-field-' + field.name}
              className={classes.field}
              data-cy={`settings-ui-${field.name}`}
            >
              <InternalWrapper title={field.label}>
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
              </InternalWrapper>
            </Stack>
          ))}
        </Stack>
      </FormProvider>
    </Box>
  )
}
