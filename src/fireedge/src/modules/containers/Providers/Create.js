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
import { ReactElement, useEffect } from 'react'
import { Redirect, useHistory, useParams } from 'react-router'

import { ProviderAPI, useGeneralApi } from '@FeaturesModule'

import {
  PATH,
  TranslateProvider,
  Form,
  DefaultFormStepper,
  SkeletonStepsForm,
} from '@ComponentsModule'

import {
  getConnectionFixed,
  isValidProviderTemplate,
  getConnectionEditable,
} from '@ModelsModule'

import { deepmerge } from '@UtilsModule'
import { T } from '@ConstantsModule'
const { Provider } = Form

/**
 * Displays the creation or modification form to a Provider.
 *
 * @returns {ReactElement} Create Provider form
 */
export function CreateProvider() {
  const history = useHistory()
  const { id } = useParams()
  const { enqueueSuccess, enqueueError } = useGeneralApi()

  const [createProvider] = ProviderAPI.useCreateProviderMutation()
  const [
    updateProvider,
    { isSuccess: successUpdate, originalArgs: { id: updatedProviderId } = {} },
  ] = ProviderAPI.useUpdateProviderMutation()

  const { data: providerConfig, error: errorConfig } =
    ProviderAPI.useGetProviderConfigQuery(undefined, {
      refetchOnMountOrArgChange: false,
    })

  const [getConnection, { data: connection, error: errorConnection }] =
    ProviderAPI.useLazyGetProviderConnectionQuery()

  const [getProvider, { data: provider, error: errorProvider }] =
    ProviderAPI.useLazyGetProviderQuery()

  const onSubmit = async (formData) => {
    try {
      const { template, connection: editedConn, configuration } = formData

      const connectionFixed = getConnectionFixed(template, providerConfig)
      const allConnections = { ...editedConn, ...connectionFixed }
      const editedData = { ...configuration, connection: allConnections }
      const submitData = { ...deepmerge(template, editedData) }

      if (id !== undefined) {
        await updateProvider({ id, data: submitData })
      } else {
        if (!isValidProviderTemplate(submitData, providerConfig)) {
          enqueueError(T.ErrorProviderTemplateSelected)
          history.push(PATH.INFRASTRUCTURE.PROVIDERS.LIST)
        }

        const responseId = await createProvider({ data: submitData }).unwrap()
        responseId && enqueueSuccess(T.SuccessProviderCreated, responseId)
      }

      history.push(PATH.INFRASTRUCTURE.PROVIDERS.LIST)
    } catch {}
  }

  useEffect(() => {
    id && getProvider(id)
    id && getConnection(id)
  }, [])

  useEffect(() => {
    successUpdate && enqueueSuccess(T.SuccessProviderUpdated, updatedProviderId)
  }, [successUpdate])

  if (errorConfig || errorConnection || errorProvider) {
    return <Redirect to={PATH.INFRASTRUCTURE.PROVIDERS.LIST} />
  }

  const getInitialValues = () => {
    if (id === undefined) return

    // overwrite decrypted connection
    const fakeProviderTemplate = {
      ...(provider?.TEMPLATE?.PROVISION_BODY ?? {}),
      connection,
    }

    const connectionEditable = getConnectionEditable(
      fakeProviderTemplate,
      providerConfig
    )

    return {
      template: fakeProviderTemplate,
      connection: connectionEditable,
    }
  }

  return (
    <TranslateProvider>
      {id && (!providerConfig || !connection || !provider) ? (
        <SkeletonStepsForm />
      ) : (
        <Provider.CreateForm
          initialValues={getInitialValues()}
          stepProps={{ isUpdate: id !== undefined }}
          onSubmit={onSubmit}
          fallback={<SkeletonStepsForm />}
        >
          {(config) => <DefaultFormStepper {...config} />}
        </Provider.CreateForm>
      )}
    </TranslateProvider>
  )
}
