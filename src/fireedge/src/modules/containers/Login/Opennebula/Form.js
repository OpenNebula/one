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
/* eslint-disable jsdoc/require-jsdoc */
import { ArrowTrSquare } from 'iconoir-react'
import PropTypes from 'prop-types'
import { useEffect, useMemo } from 'react'
import { Box, Divider, Link, Stack, useTheme } from '@mui/material'
import { yupResolver } from '@hookform/resolvers/yup'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { FormWithSchema } from '@ResourcesModule'
import { Translate } from '@ProvidersModule'
import { getDigits } from '@UtilsModule'
import { DEFAULT_OTP_LENGTH, INPUT_TYPES, T } from '@ConstantsModule'

import { SubmitButton } from '@ComponentsV2Module'
import { styles } from '@modules/containers/Login/styles'

const getErrorMessage = (error) =>
  typeof error === 'string' ? error : error?.message

const getErrorFields = ({ error, errorField, fields = [] } = {}) =>
  []
    .concat(
      (typeof error === 'string' ? undefined : error?.field) ||
        errorField ||
        fields[0]?.name
    )
    .filter(Boolean)

export const Form = ({
  onBack,
  onSubmit,
  resolver,
  fields,
  error,
  errorField,
  isLoading,
  remoteRedirect,
}) => {
  const theme = useTheme()
  const classes = useMemo(() => styles(theme), [theme])
  const methods = useForm({
    reValidateMode: 'onSubmit',
    defaultValues: resolver.default(),
    resolver: yupResolver(resolver),
  })
  const { clearErrors, handleSubmit, setError } = methods

  const otpField = fields.find(({ type }) => type === INPUT_TYPES.OTP)
  const otpLength = otpField?.fieldProps?.length ?? DEFAULT_OTP_LENGTH
  const otpValue = useWatch({
    control: methods.control,
    disabled: !otpField,
    name: otpField?.name,
  })
  const isOtpComplete =
    !otpField || getDigits(otpValue, otpLength).length === otpLength

  useEffect(() => {
    const message = getErrorMessage(error)
    const fieldNames = getErrorFields({ error, errorField, fields })

    if (!message) {
      clearErrors(fieldNames)

      return
    }

    fieldNames.forEach((fieldName) => {
      setError(fieldName, { type: 'manual', message })
    })
  }, [clearErrors, error, errorField, fields, setError])

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      width="100%"
      display="flex"
      flexDirection="column"
      flexShrink={0}
      gap={5}
      justifyContent={{ sm: 'center' }}
      sx={{ opacity: isLoading ? 0.7 : 1 }}
    >
      <FormProvider {...methods}>
        <FormWithSchema
          cy="login"
          fields={fields}
          rootProps={{
            className: classes.loginFields,
            sx: { margin: 0 },
          }}
          gridItemSx={{ padding: '0 !important' }}
          gridContainerSx={{
            width: '100% !important',
            margin: '0 !important',
            gap: 3,
            '& .textfield-container, & .textfield-root': {
              width: '100%',
            },
          }}
        />
      </FormProvider>
      <Stack className={classes.loginSubmit} direction="row" gap={2}>
        <SubmitButton
          data-cy="login-button"
          isDisabled={!isOtpComplete}
          isSubmitting={isLoading}
          sx={{ width: '100%' }}
          label={<Translate word={onBack ? T.Next : T.SignIn} />}
        />
      </Stack>
      {remoteRedirect && (
        <>
          <Divider />
          <Stack direction="row" gap={2}>
            <Link
              component="button"
              variant="body2"
              onClick={() => {
                window.location.href = remoteRedirect
              }}
              data-cy="link-saml"
              sx={{
                display: 'inline-flex',
                gap: 0.5,
                alignItems: 'center',
              }}
            >
              <Translate word={T.SignInRemote} /> <ArrowTrSquare />
            </Link>
          </Stack>
        </>
      )}
    </Box>
  )
}

Form.propTypes = {
  onBack: PropTypes.func,
  resolver: PropTypes.object,
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
    })
  ),
  onSubmit: PropTypes.func.isRequired,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  errorField: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  isLoading: PropTypes.bool,
  remoteRedirect: PropTypes.string,
}

Form.defaultProps = {
  onBack: undefined,
  onSubmit: () => undefined,
  resolver: {},
  fields: [],
  error: undefined,
  errorField: undefined,
  isLoading: false,
}
