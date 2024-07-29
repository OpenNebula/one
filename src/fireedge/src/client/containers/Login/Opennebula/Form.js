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
/* eslint-disable jsdoc/require-jsdoc */
import { useEffect } from 'react'
import PropTypes from 'prop-types'

import { Button, Box, Slide, Stack } from '@mui/material'
import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { SubmitButton } from 'client/components/FormControl'
import { Translate } from 'client/components/HOC'
import { T } from 'client/constants'

const Form = ({
  onBack,
  onSubmit,
  resolver,
  fields,
  error,
  isLoading,
  transitionProps,
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
        justifyContent={{ sm: 'center' }}
        sx={{ opacity: isLoading ? 0.7 : 1 }}
      >
        <FormProvider {...methods}>
          <FormWithSchema cy="login" fields={fields} />
        </FormProvider>
        <Stack direction="row" gap={1} my={2}>
          {onBack && (
            <Button color="secondary" onClick={onBack} disabled={isLoading}>
              <Translate word={T.Back} />
            </Button>
          )}
          <SubmitButton
            color="secondary"
            data-cy="login-button"
            isSubmitting={isLoading}
            sx={{ textTransform: 'uppercase' }}
            label={<Translate word={onBack ? T.Next : T.SignIn} />}
          />
        </Stack>
      </Box>
    </Slide>
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

export default Form
