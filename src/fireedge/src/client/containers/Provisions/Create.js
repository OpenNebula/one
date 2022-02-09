/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { useEffect, useState, memo } from 'react'
import { Redirect, useHistory } from 'react-router'

import { NavArrowLeft as ArrowBackIcon } from 'iconoir-react'
import {
  Container,
  LinearProgress,
  IconButton,
  Typography,
} from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'

import { useFetch, useSocket } from 'client/hooks'
import { useGeneralApi } from 'client/features/General'
import { useProviderApi, useProvisionApi } from 'client/features/One'
import DebugLog from 'client/components/DebugLog'
import { CreateForm } from 'client/components/Forms/Provision'
import { PATH } from 'client/apps/provision/routes'
import { Translate } from 'client/components/HOC'
import { isDevelopment } from 'client/utils'
import { T } from 'client/constants'

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    marginBottom: '1em',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.8em',
  },
})

function ProvisionCreateForm() {
  const classes = useStyles()
  const [uuid, setUuid] = useState(undefined)

  const { getProvisionSocket: socket } = useSocket()
  const { enqueueInfo } = useGeneralApi()
  const { createProvision } = useProvisionApi()
  const { getProviders } = useProviderApi()
  const { data, fetchRequest, loading, error } = useFetch(getProviders)

  const onSubmit = async (formData) => {
    try {
      const response = await createProvision(formData)
      enqueueInfo('Creating provision')

      response && setUuid(response)
    } catch (err) {
      isDevelopment() && console.error(err)
    }
  }

  useEffect(() => {
    fetchRequest()
  }, [])

  if (uuid) {
    return <DebugLog {...{ uuid, socket, title: <Title /> }} />
  }

  if (error) {
    return <Redirect to={PATH.PROVISIONS.LIST} />
  }

  return !data || loading ? (
    <LinearProgress color="secondary" />
  ) : (
    <Container className={classes.container} disableGutters>
      <CreateForm onSubmit={onSubmit} />
    </Container>
  )
}

const Title = memo(() => {
  const classes = useStyles()
  const history = useHistory()
  const backToProvisionList = () => history.push(PATH.PROVISIONS.LIST)

  return (
    <div className={classes.title}>
      <IconButton size="medium" onClick={backToProvisionList}>
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="body1" component="span">
        <Translate word={T.BackToList} values={T.Provisions} />
      </Typography>
    </div>
  )
})

Title.displayName = 'BackToProvisionList'

export default ProvisionCreateForm
