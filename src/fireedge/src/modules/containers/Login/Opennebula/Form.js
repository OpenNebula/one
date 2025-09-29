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
/* eslint-disable jsdoc/require-jsdoc */
import { ArrowTrSquare } from 'iconoir-react'
import PropTypes from 'prop-types'
import { useEffect } from 'react'

import { Box, Divider, Link, Slide, Stack } from '@mui/material'

import { yupResolver } from '@hookform/resolvers/yup'
import { FormProvider, useForm } from 'react-hook-form'

import {
  FormWithSchema,
  SubmitButton,
  Translate,
  TranslateProvider,
} from '@ComponentsModule'
import { STYLE_BUTTONS, T } from '@ConstantsModule'

export const Form = ({
  onBack,
  onSubmit,
  resolver,
  fields,
  error,
  isLoading,
  transitionProps,
  remoteRedirect,
}) => {
  const { handleSubmit, setError, ...methods } = useForm({
    reValidateMode: 'onSubmit',
    defaultValues: resolver.default(),
    resolver: yupResolver(resolver),
  })

  useEffect(() => {
    error && setError(fields[0].name, { type: 'manual', message: error })
  }, [error])

  return (
    <TranslateProvider>
      <Slide
        timeout={{ enter: 400 }}
        mountOnEnter
        unmountOnExit
        {...transitionProps}
      >
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          width="100%"
          display="flex"
          flexDirection="column"
          flexShrink={0}
          gap="2rem"
          justifyContent={{ sm: 'center' }}
          sx={{ opacity: isLoading ? 0.7 : 1 }}
        >
          <FormProvider {...methods}>
            <FormWithSchema
              cy="login"
              fields={fields}
              rootProps={{ sx: { margin: 0 } }}
              gridItemSx={{ padding: '0rem !important' }}
              gridContainerSx={{
                width: '100% !important',
                margin: '0rem !important',
                gap: '2rem',
              }}
            />
          </FormProvider>
          <Stack direction="row" sx={{ gap: '1rem' }}>
            {onBack && (
              <SubmitButton
                onClick={onBack}
                disabled={isLoading}
                sx={{ textTransform: 'uppercase', width: '100%' }}
                importance={STYLE_BUTTONS.IMPORTANCE.SECONDARY}
                type={STYLE_BUTTONS.TYPE.FILLED}
                size={STYLE_BUTTONS.SIZE.LARGE}
                label={<Translate word={T.Back} />}
              ></SubmitButton>
            )}
            <SubmitButton
              data-cy="login-button"
              isSubmitting={isLoading}
              sx={{ textTransform: 'uppercase', width: '100%' }}
              label={<Translate word={onBack ? T.Next : T.SignIn} />}
              importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
              type={STYLE_BUTTONS.TYPE.FILLED}
              size={STYLE_BUTTONS.SIZE.LARGE}
            />
          </Stack>
          {remoteRedirect && (
            <>
              <Divider />
              <Stack direction="row" sx={{ gap: '1rem' }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => {
                    window.location.href = remoteRedirect
                  }}
                  data-cy="link-saml"
                  sx={{
                    display: 'inline-flex',
                    gap: '0.4rem',
                    alignItems: 'center',
                  }}
                >
                  <Translate word={T.SignInRemote} /> <ArrowTrSquare />
                </Link>
              </Stack>
            </>
          )}
        </Box>
      </Slide>
    </TranslateProvider>
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
  error: PropTypes.string,
  isLoading: PropTypes.bool,
  transitionProps: PropTypes.shape({
    name: PropTypes.string,
  }),
  remoteRedirect: PropTypes.string,
}

Form.defaultProps = {
  onBack: undefined,
  onSubmit: () => undefined,
  resolver: {},
  fields: [],
  error: undefined,
  isLoading: false,
  transitionProps: undefined,
}
