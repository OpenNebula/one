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
import { useState, memo, ReactElement } from 'react'
import { Redirect, useHistory } from 'react-router'

import { NavArrowLeft as ArrowBackIcon } from 'iconoir-react'
import { Box, IconButton, Typography } from '@mui/material'

import { useSocket } from 'client/hooks'
import { useGeneralApi } from 'client/features/General'
import { useCreateProvisionMutation } from 'client/features/OneApi/provision'
import { useGetProvidersQuery } from 'client/features/OneApi/provider'

import {
  DefaultFormStepper,
  SkeletonStepsForm,
} from 'client/components/FormStepper'
import DebugLog from 'client/components/DebugLog'
import { CreateForm } from 'client/components/Forms/Provision'
import { PATH } from 'client/apps/provision/routes'
import { Translate } from 'client/components/HOC'
import { T } from 'client/constants'

/**
 * Renders the creation form to a Provision.
 *
 * @returns {ReactElement} Create Provision form
 */
function ProvisionCreateForm() {
  const [uuid, setUuid] = useState(undefined)

  const { getProvisionSocket: socket } = useSocket()
  const { enqueueInfo } = useGeneralApi()
  const [createProvision] = useCreateProvisionMutation()
  const { data: providers, isLoading, error } = useGetProvidersQuery()

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
    return <Redirect to={PATH.PROVISIONS.LIST} />
  }

  return !providers || isLoading ? (
    <SkeletonStepsForm />
  ) : (
    <CreateForm onSubmit={onSubmit} fallback={<SkeletonStepsForm />}>
      {(config) => <DefaultFormStepper {...config} />}
    </CreateForm>
  )
}

const Title = memo(() => {
  const history = useHistory()
  const backToProvisionList = () => history.push(PATH.PROVISIONS.LIST)

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

export default ProvisionCreateForm
