/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Redirect } from 'react-router'

import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

import { useFetchAll } from 'client/hooks'
import { useAuth } from 'client/features/Auth'
import { useProviderApi } from 'client/features/One'
import FormStepper, { SkeletonStepsForm } from 'client/components/FormStepper'
import Steps from 'client/components/Forms/Provider/CreateForm/Steps'
import { PATH } from 'client/apps/provision/routes'

const CreateForm = ({ provider, providerConfig, connection, onSubmit }) => {
  const initialValues = provider && { provider, connection, providerConfig }
  const stepProps = { isUpdate: !!initialValues }

  const stepsForm = useMemo(() => Steps(stepProps, initialValues), [])
  const { steps, defaultValues, resolver, transformBeforeSubmit } = stepsForm

  const methods = useForm({
    mode: 'onSubmit',
    defaultValues,
    resolver: yupResolver(resolver()),
  })

  return (
    <FormProvider {...methods}>
      <FormStepper
        steps={steps}
        schema={resolver}
        onSubmit={(data) =>
          onSubmit(transformBeforeSubmit?.(data, providerConfig) ?? data)
        }
      />
    </FormProvider>
  )
}

const PreFetchingForm = ({ providerId, onSubmit }) => {
  const { providerConfig } = useAuth()
  const { getProvider, getProviderConnection } = useProviderApi()
  const { data, fetchRequestAll, error } = useFetchAll()
  const [provider, connection] = data ?? []

  useEffect(() => {
    providerId &&
      fetchRequestAll([
        getProvider(providerId),
        getProviderConnection(providerId),
      ])
  }, [])

  if (error) {
    return <Redirect to={PATH.PROVIDERS.LIST} />
  }

  return providerId && !data ? (
    <SkeletonStepsForm />
  ) : (
    <CreateForm
      provider={provider}
      providerConfig={providerConfig}
      connection={connection}
      onSubmit={onSubmit}
    />
  )
}

PreFetchingForm.propTypes = {
  providerId: PropTypes.string,
  onSubmit: PropTypes.func,
}

CreateForm.propTypes = {
  provider: PropTypes.object,
  connection: PropTypes.object,
  providerConfig: PropTypes.object,
  onSubmit: PropTypes.func,
}

export default PreFetchingForm
