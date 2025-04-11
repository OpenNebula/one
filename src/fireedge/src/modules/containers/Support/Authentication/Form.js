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
import { useEffect, ReactElement, useMemo } from 'react'
import PropTypes from 'prop-types'

import { Box, Stack, Typography, useTheme } from '@mui/material'
import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

import {
  FormWithSchema,
  SubmitButton,
  Translate,
  TranslateProvider,
} from '@ComponentsModule'
import { T, STYLE_BUTTONS } from '@ConstantsModule'
import { css } from '@emotion/css'

import {
  FORM_USER_SCHEMA as resolver,
  FORM_USER_FIELDS as fields,
} from '@modules/containers/Support/Authentication/schema'

const useStyles = (theme) => ({
  title: css({
    display: 'flex',
    gap: theme.spacing(1),
  }),
  iconSpacing: css({
    pl: theme.spacing(1),
  }),
  documentationIcon: css({
    fontSize: 'xxx-large',
    color: theme.palette.text.secondary,
  }),
  documentationBox: css({
    textAlign: 'center',
  }),
  links: css({
    color: theme.palette.primary.dark,
    textDecoration: 'none',
    fontWeight: 'bold',
    textAlign: 'center',
  }),
})
/**
 * Support login form.
 *
 * @param {object} params - Form props
 * @param {function()} params.onSubmit - Submit function
 * @param {string} params.error - Error message
 * @param {boolean} params.isLoading - Is loading indicator
 * @returns {ReactElement} Support login form
 */
export const Form = ({ onSubmit, error, isLoading }) => {
  const theme = useTheme()
  const classes = useMemo(() => useStyles(theme), [theme])

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
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        width="100%"
        flexDirection="column"
        flexShrink={0}
        justifyContent={{ sm: 'center' }}
        sx={{ opacity: isLoading ? 0.7 : 1 }}
      >
        <FormProvider {...methods}>
          <FormWithSchema cy="login" fields={fields} />
        </FormProvider>
        <Stack direction="row-reverse" gap={1} my={2}>
          <SubmitButton
            data-cy="login-button"
            isSubmitting={isLoading}
            sx={{ textTransform: 'uppercase' }}
            importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
            size={STYLE_BUTTONS.SIZE.MEDIUM}
            type={STYLE_BUTTONS.TYPE.FILLED}
            label={T.SignIn}
          />
        </Stack>
        <Stack>
          <Typography alignSelf="center">
            <Translate word={T.Or} />
          </Typography>
          <a
            href="https://opennebula.io/buy-support"
            className={classes.links}
            target="_blank"
            rel="noreferrer"
          >
            <Translate word={T.GetAnAccount} />
          </a>
        </Stack>
      </Box>
    </TranslateProvider>
  )
}

Form.propTypes = {
  resolver: PropTypes.object,
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
    })
  ),
  onSubmit: PropTypes.func.isRequired,
  error: PropTypes.string,
  isLoading: PropTypes.bool,
}

Form.defaultProps = {
  onSubmit: () => undefined,
  resolver: {},
  fields: [],
  error: undefined,
  isLoading: false,
}

export default Form
