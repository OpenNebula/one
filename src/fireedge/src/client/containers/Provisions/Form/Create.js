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
import React, { useEffect } from 'react'
import { Redirect } from 'react-router'

import { makeStyles, Container, LinearProgress } from '@material-ui/core'

import { useFetch } from 'client/hooks'
import { useProviderApi } from 'client/features/One'
import ProvisionForm from 'client/containers/Provisions/Form/ProvisionForm'
import { PATH } from 'client/apps/provision/routes'

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column'
  }
})

function ProvisionCreateForm () {
  const classes = useStyles()
  const { getProviders } = useProviderApi()
  const { data, fetchRequest, loading, error } = useFetch(getProviders)

  useEffect(() => { fetchRequest() }, [])

  if (error) {
    return <Redirect to={PATH.PROVISIONS.LIST} />
  }

  return !data || loading ? (
    <LinearProgress color='secondary' />
  ) : (
    <Container className={classes.container} disableGutters>
      <ProvisionForm />
    </Container>
  )
}

export default ProvisionCreateForm
