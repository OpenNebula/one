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
import { useState, useMemo, JSXElementConstructor } from 'react'
import { Container, TextField, Autocomplete, Grid, Box } from '@mui/material'

import ResponseForm from 'client/containers/TestApi/ResponseForm'
import { InputCode } from 'client/components/FormControl'

import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'
import Commands from 'server/utils/constants/commands'

import testApiStyles from 'client/containers/TestApi/styles'

const COMMANDS = Object.keys(Commands)?.sort()

/**
 * @returns {JSXElementConstructor} - Component that allows you
 * to fetch, resolve, and interact with OpenNebula API.
 */
function TestApi () {
  const classes = testApiStyles()
  const [name, setName] = useState(() => COMMANDS[0])
  const [response, setResponse] = useState('')

  const handleChangeCommand = (_, value) => setName(value)
  const handleChangeResponse = res => setResponse(res)

  return (
    <Container
      disableGutters
      sx={{ display: 'flex', flexFlow: 'column', height: '100%' }}
    >
      <Grid container direction='row' spacing={2} className={classes.root}>
        <Grid item xs={12} md={6}>
          <Autocomplete
            disablePortal
            color='secondary'
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
        <Grid item xs={12} md={6}>
          <Box height='100%' minHeight={200}>
            <InputCode code={response} readOnly />
          </Box>
        </Grid>
      </Grid>
    </Container>
  )
}

export default TestApi
