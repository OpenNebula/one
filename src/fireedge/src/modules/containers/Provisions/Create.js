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
import { ReactElement, memo, useState } from 'react'
import { Redirect, useHistory } from 'react-router'

import { Box, IconButton, Typography } from '@mui/material'
import { NavArrowLeft as ArrowBackIcon } from 'iconoir-react'

import { useSocket } from '@HooksModule'
import { useGeneralApi, ProvisionAPI, ProviderAPI } from '@FeaturesModule'

import {
  DebugLog,
  Translate,
  TranslateProvider,
  PATH,
  Form,
  SkeletonStepsForm,
  DefaultFormStepper,
} from '@ComponentsModule'
import { T } from '@ConstantsModule'
const { Provision } = Form
/**
 * Renders the creation form to a Provision.
 *
 * @returns {ReactElement} Create Provision form
 */
export function CreateProvision() {
  const [uuid, setUuid] = useState(undefined)

  const { getProvisionSocket: socket } = useSocket()
  const { enqueueInfo } = useGeneralApi()
  const [createProvision] = ProvisionAPI.useCreateProvisionMutation()
  const {
    data: providers,
    isLoading,
    error,
  } = ProviderAPI.useGetProvidersQuery()

  const onSubmit = async (formData) => {
    try {
      const response = await createProvision({ data: formData }).unwrap()
      enqueueInfo(T.InfoProvisionCreate)

      response && setUuid(response)
    } catch {}
  }

  if (uuid) {
    return <DebugLog {...{ uuid, socket, title: <Title /> }} />
  }

  if (error) {
    return <Redirect to={PATH.INFRASTRUCTURE.PROVISIONS.LIST} />
  }

  return (
    <TranslateProvider>
      {!providers || isLoading ? (
        <SkeletonStepsForm />
      ) : (
        <Provision.CreateForm
          onSubmit={onSubmit}
          fallback={<SkeletonStepsForm />}
        >
          {(config) => <DefaultFormStepper {...config} />}
        </Provision.CreateForm>
      )}
    </TranslateProvider>
  )
}

const Title = memo(() => {
  const history = useHistory()
  const backToProvisionList = () =>
    history.push(PATH.INFRASTRUCTURE.PROVISIONS.LIST)

  return (
    <Box mb="1em" display="inline-flex" alignItems="center" gap="0.8em">
      <IconButton size="medium" onClick={backToProvisionList}>
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="body1" component="span">
        <Translate word={T.BackToList} values={T.Provisions} />
      </Typography>
    </Box>
  )
})

Title.displayName = 'BackToProvisionList'
