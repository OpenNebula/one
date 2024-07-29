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
import { useMemo, ReactElement } from 'react'
import { Grid, Button } from '@mui/material'
import { useForm, FormProvider } from 'react-hook-form'
import { object } from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

import { FormWithSchema } from 'client/components/Forms'

/**
 * @returns {ReactElement}
 * Component that allows you to test a form and their components
 */
function TestForm() {
  const fields = useMemo(
    () => [
      /* To add the fields validation */
    ],
    []
  )
  const resolver = useMemo(() => object() /* To add the form schema */, [])

  const methods = useForm({
    mode: 'onSubmit',
    defaultValues: resolver.default(),
    resolver: yupResolver(resolver, { isSubmit: true }),
  })

  const onSubmit = (values) => {
    console.log({ values })
  }

  return (
    <Grid
      container
      direction="row"
      spacing={2}
      component="form"
      onSubmit={methods.handleSubmit(onSubmit)}
    >
      <Grid item xs={12}>
        <FormProvider {...methods}>
          <FormWithSchema fields={fields} />
        </FormProvider>
      </Grid>
      <Grid item xs={12}>
        <Button type="submit" variant="contained">
          {'Submit'}
        </Button>
      </Grid>
    </Grid>
  )
}

export default TestForm
