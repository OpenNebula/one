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
import { useEffect, useCallback } from 'react'

import { Divider, Paper, Typography } from '@material-ui/core'

import { useVNetworkApi, useVNetworkTemplateApi } from 'client/features/One'
import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { T } from 'client/constants'

import { FORM_FIELDS, STEP_FORM_SCHEMA } from './schema'

export const STEP_ID = 'networking'

const Networks = () => ({
  id: STEP_ID,
  label: T.ConfigureNetworking,
  resolver: STEP_FORM_SCHEMA,
  optionsValidate: { abortEarly: false },
  content: useCallback(({ data }) => {
    const { getVNetworks } = useVNetworkApi()
    const { getVNetworkTemplates } = useVNetworkTemplateApi()

    useEffect(() => {
      getVNetworks()
      getVNetworkTemplates()
    }, [])

    return data?.map(({ id, name, description }, index) => (
      <Paper
        key={`net-${id}`}
        variant="outlined"
        style={{ marginTop: 10, marginBottom: 10, padding: 10 }}
      >
        <Typography variant="body1">{name}</Typography>
        {description && <Typography variant="body2">{description}</Typography>}
        <Divider style={{ marginBottom: 8 }} />
        <FormWithSchema
          cy="deploy-network"
          fields={FORM_FIELDS}
          id={`${STEP_ID}[${index}]`}
        />
      </Paper>
    ))
  }, [])
})

export default Networks
