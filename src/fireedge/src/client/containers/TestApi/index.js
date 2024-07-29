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
import { useState, useMemo, ReactElement } from 'react'
import { TextField, Autocomplete, Grid, Box } from '@mui/material'

import Commands from 'server/utils/constants/commands'
import ResponseForm from 'client/containers/TestApi/ResponseForm'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const COMMANDS = Object.keys(Commands)?.sort()

/**
 * @returns {ReactElement} - Component that allows you
 * to fetch, resolve, and interact with OpenNebula API.
 */
function TestApi() {
  const [name, setName] = useState(() => COMMANDS[0])
  const [response, setResponse] = useState({})

  const handleChangeCommand = (_, value) => setName(value)
  const handleChangeResponse = (res) => setResponse(res)

  const totalResults = useMemo(() => {
    const data = response?.data || {}
    const [firstKey, firstValue] = Object.entries(data)[0] ?? []
    const isPool = firstKey?.endsWith('_POOL')

    if (!isPool) return

    return Object.values(firstValue)?.[0]?.length
  }, [response])

  return (
    <Grid container direction="row" spacing={2} width={1} height={1}>
      <Grid item xs={12} md={6}>
        <Autocomplete
          disablePortal
          color="secondary"
          options={useMemo(() => COMMANDS, [])}
          value={name}
          onChange={handleChangeCommand}
          renderInput={(params) => (
            <TextField {...params} label={Tr(T.SelectRequest)} />
          )}
        />
        {name && name !== '' && (
          <ResponseForm
            handleChangeResponse={handleChangeResponse}
            command={{ name, ...Commands[name] }}
          />
        )}
      </Grid>
      <Grid item xs={12} md={6} sx={{ height: { xs: '50%', md: 1 } }}>
        <Box height="100%" overflow="auto" bgcolor="background.paper" p={1}>
          {totalResults && <p>{`Total results: ${totalResults}`}</p>}
          <pre>
            <code
              style={{ whiteSpace: 'break-spaces', wordBreak: 'break-all' }}
            >
              {JSON.stringify(response, null, 2)}
            </code>
          </pre>
        </Box>
      </Grid>
    </Grid>
  )
}

export default TestApi
