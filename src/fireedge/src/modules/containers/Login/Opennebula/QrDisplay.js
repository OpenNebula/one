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

import { Stack, Box, Link, List, ListItemText, Typography } from '@mui/material'
import { FormWithSchema, Tr, Translate, SubmitButton } from '@ComponentsModule'
import { AUTH_APPS, T, STYLE_BUTTONS } from '@ConstantsModule'
import { FIELDS } from '@modules/containers/Settings/Tfa/schema'
import { AuthAPI } from '@FeaturesModule'
import { Component, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import PropTypes from 'prop-types'

/**
 * @param {object} params - Params
 * @param {string }params.imgSrc - Image URL source
 * @param {string} params.token - User password/token
 * @param {string} params.user - Username
 * @param {boolean} params.remember - Extend session token expiration
 * @returns {Component} Qr code display handler
 */
export const QrDisplay = ({ imgSrc, token, user, remember } = {}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [login, loginState] = AuthAPI.useLoginMutation()
  const [getAuthUser] = AuthAPI.useLazyGetAuthUserQuery()
  const { handleSubmit, setError, ...methods } = useForm({
    reValidateMode: 'onChange',
  })

  const submitToken = handleSubmit(async ({ TOKEN: tfatoken }) => {
    try {
      setIsLoading(true)
      if (!tfatoken) return
      const response = await login({ user, token, tfatoken, remember })
      await getAuthUser()

      const { error } = response

      error &&
        setError(FIELDS[0].name, {
          type: 'custom',
          message: error?.data ?? T.Error,
        })
    } catch {
    } finally {
      setIsLoading(false)
    }
  })

  return (
    <Stack
      direction="column"
      spacing={1}
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          textAlign: 'center',
        }}
      >
        <Translate word={T.EnforceTFAConcept} />
      </Typography>
      <Typography variant="caption">
        <Translate word={T.ScanThisQr} />
      </Typography>
      <Box
        component="img"
        src={imgSrc}
        alt={Tr(T.ScanThisQr)}
        data-cy="qrTfa"
        sx={{
          width: '300px',
          height: '300px',
        }}
      />
      <FormProvider {...methods}>
        <FormWithSchema cy={'2fa-ui'} fields={FIELDS} />
      </FormProvider>
      <SubmitButton
        onClick={submitToken}
        data-cy="addTfa"
        label={T.Continue}
        variant="contained"
        isSubmitting={
          loginState?.isLoading || loginState?.isFetching || isLoading
        }
        importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
        type={STYLE_BUTTONS.TYPE.FILLED}
        size={STYLE_BUTTONS.SIZE.LARGE}
        sx={{ textTransform: 'uppercase', width: '100%', marginTop: '2rem' }}
      />
      <List>
        <ListItemText>
          <Translate word={T.GetAuthenticatorApp} />
          {AUTH_APPS.map(({ text, url }) => (
            <>
              <Link
                key={text}
                href={url}
                color="info.main"
                sx={{
                  fontWeight: 'bold',
                }}
              >
                {text}
              </Link>{' '}
            </>
          ))}
        </ListItemText>
      </List>
    </Stack>
  )
}

QrDisplay.propTypes = {
  imgSrc: PropTypes.string,
  token: PropTypes.string,
  user: PropTypes.string,
  remember: PropTypes.bool,
}
