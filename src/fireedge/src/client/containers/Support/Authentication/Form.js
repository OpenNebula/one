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
import { useEffect, ReactElement } from 'react'
import PropTypes from 'prop-types'
import { AnySchema } from 'yup'

import { Box, Stack, Typography } from '@mui/material'
import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import makeStyles from '@mui/styles/makeStyles'

import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { SubmitButton } from 'client/components/FormControl'
import { Translate } from 'client/components/HOC'
import { T } from 'client/constants'

const useStyles = makeStyles((theme) => ({
  title: {
    display: 'flex',
    gap: theme.spacing(1),
  },
  iconSpacing: {
    pl: theme.spacing(1),
  },
  documentationIcon: {
    fontSize: 'xxx-large',
    color: theme.palette.text.secondary,
  },
  documentationBox: {
    textAlign: 'center',
  },
  links: {
    color: theme.palette.secondary.dark,
    textDecoration: 'none',
    fontWeight: 'bold',
    textAlign: 'center',
  },
}))

/**
 * Support login form.
 *
 * @param {object} params - Form props
 * @param {function()} params.onSubmit - Submit function
 * @param {function():AnySchema} params.resolver - Resolver Schema
 * @param {object[]} params.fields - Form Fields
 * @param {string} params.error - Error message
 * @param {boolean} params.isLoading - Is loading indicator
 * @returns {ReactElement} Support login form
 */
const Form = ({ onSubmit, resolver, fields, error, isLoading }) => {
  const classes = useStyles()

  const { handleSubmit, setError, ...methods } = useForm({
    reValidateMode: 'onSubmit',
    defaultValues: resolver.default(),
    resolver: yupResolver(resolver),
  })

  useEffect(() => {
    error && setError(fields[0].name, { type: 'manual', message: error })
  }, [error])

  return (
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
          color="secondary"
          data-cy="login-button"
          isSubmitting={isLoading}
          sx={{ textTransform: 'uppercase' }}
          label={<Translate word={T.SignIn} />}
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
