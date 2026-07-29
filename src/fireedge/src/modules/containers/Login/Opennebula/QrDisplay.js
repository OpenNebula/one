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

import { Stack, Box, Link, Typography } from '@mui/material'
import { Translate, useTranslation } from '@ProvidersModule'
import { getDigits } from '@UtilsModule'
import { OtpInput, StepList, SubmitButton } from '@ComponentsV2Module'
import {
  AUTH_APPS,
  DEFAULT_OTP_LENGTH,
  T,
  STYLE_BUTTONS,
} from '@ConstantsModule'
import { FIELDS } from '@modules/containers/Settings/Tfa/schema'
import { AuthAPI } from '@FeaturesModule'

import { Component, Fragment, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import PropTypes from 'prop-types'

const TOKEN_FIELD = FIELDS[0].name

/**
 * @param {object} params - Params
 * @param {string }params.imgSrc - Image URL source
 * @param {string} params.token - User password/token
 * @param {string} params.user - Username
 * @param {boolean} params.remember - Extend session token expiration
 * @returns {Component} Qr code display handler
 */
export const QrDisplay = ({ imgSrc, token, user, remember } = {}) => {
  const { translate } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [login, loginState] = AuthAPI.useLoginMutation()
  const [getAuthUser] = AuthAPI.useLazyGetAuthUserQuery()
  const { clearErrors, control, getValues, handleSubmit, setError } = useForm({
    reValidateMode: 'onChange',
    defaultValues: { [TOKEN_FIELD]: '' },
  })
  const tokenValue = useWatch({ control, name: TOKEN_FIELD })
  const isSubmitting =
    loginState?.isLoading || loginState?.isFetching || isLoading
  const isTokenComplete =
    getDigits(tokenValue, DEFAULT_OTP_LENGTH).length === DEFAULT_OTP_LENGTH

  const handleTokenBlur = () => {
    const isComplete =
      getDigits(getValues(TOKEN_FIELD), DEFAULT_OTP_LENGTH).length ===
      DEFAULT_OTP_LENGTH

    if (!isComplete) {
      setError(TOKEN_FIELD, {
        type: 'validate',
        message: T.EnterVerificationCode,
      })

      return
    }

    clearErrors(TOKEN_FIELD)
  }

  const submitToken = handleSubmit(async ({ [TOKEN_FIELD]: tfatoken }) => {
    try {
      setIsLoading(true)
      if (!tfatoken) return
      const response = await login({ user, token, tfatoken, remember })
      const { data, error } = response

      if (error) {
        setError(TOKEN_FIELD, {
          type: 'custom',
          message:
            error?.status === 401 ? T.InvalidTfa : error?.data ?? T.Error,
        })

        return
      }

      if (data?.status === 'ok') {
        const authUserResponse = await getAuthUser()

        if (authUserResponse?.error) {
          setError(TOKEN_FIELD, {
            type: 'custom',
            message: T.InvalidTfa,
          })
        }
      }
    } catch {
    } finally {
      setIsLoading(false)
    }
  })

  return (
    <Stack width="100%" gap={5}>
      <Stack gap={0.5}>
        <Typography
          variant="h6"
          sx={{
            color: 'text.headings',
          }}
        >
          <Translate word={T.TwoFactorAuthenticationRequired} />
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
          <Translate word={T.TwoFactorAuthenticationSetupRequired} />
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Stack width="45%" gap={3}>
          <Typography
            variant="subtitle2"
            sx={{
              color: 'text.headings',
            }}
          >
            <Translate word={T.AuthenticationInstructions} />
          </Typography>

          <Box
            component="img"
            src={imgSrc}
            alt={translate(T.ScanThisQr)}
            data-cy="qrTfa"
            sx={{
              width: '179px',
              height: '179px',
              borderRadius: '12px',
            }}
          />

          <StepList
            items={[
              <Fragment key="authenticator-app">
                <Translate word={T.GetAuthenticatorAppOnDevice} />{' '}
                {AUTH_APPS.map(({ text, url }) => (
                  <Fragment key={text}>
                    <Link href={url}>{text}</Link>{' '}
                  </Fragment>
                ))}
              </Fragment>,
              translate(T.ScanQrWithAuthenticatorApp),
              translate(T.EnterGeneratedVerificationCode),
            ]}
          />
        </Stack>

        <Stack
          component="form"
          width="45%"
          gap={5}
          onSubmit={submitToken}
          noValidate
        >
          <Controller
            control={control}
            name={TOKEN_FIELD}
            rules={{
              validate: (fieldValue) =>
                getDigits(fieldValue, DEFAULT_OTP_LENGTH).length ===
                  DEFAULT_OTP_LENGTH || T.EnterVerificationCode,
            }}
            render={({ field, fieldState }) => (
              <OtpInput
                label={translate(T.AuthenticationCode)}
                hint={translate(T.EnterVerificationCode)}
                isDisabled={isSubmitting}
                error={fieldState.error?.message}
                length={DEFAULT_OTP_LENGTH}
                onBlur={() => {
                  field.onBlur()
                  handleTokenBlur()
                }}
                onChange={field.onChange}
                value={field.value}
              />
            )}
          />

          <Stack gap={3}>
            <SubmitButton
              data-cy="addTfa"
              isDisabled={!isTokenComplete}
              label={<Translate word={T.ActivateTFAAndContinue} />}
              type={STYLE_BUTTONS.TYPE.PRIMARY}
              isSubmitting={isSubmitting}
            />

            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              <Translate word={T.AfterTFASetupCodeUsage} />
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  )
}

QrDisplay.propTypes = {
  imgSrc: PropTypes.string,
  token: PropTypes.string,
  user: PropTypes.string,
  remember: PropTypes.bool,
}
