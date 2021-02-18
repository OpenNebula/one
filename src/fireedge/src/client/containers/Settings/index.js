/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

import * as React from 'react'

import {
  makeStyles,
  Container,
  Paper,
  Typography,
  TextField
} from '@material-ui/core'

import { useAuth, useGeneral } from 'client/hooks'
import { Tr, TranslateContext } from 'client/components/HOC'
import { T, Setting } from 'client/constants'
import SubmitButton from 'client/components/FormControl/SubmitButton'

const useStyles = makeStyles(theme => ({
  header: {
    paddingTop: '1rem'
  },
  title: {
    flexGrow: 1,
    letterSpacing: 0.1,
    fontWeight: 500
  },
  wrapper: {
    backgroundColor: theme.palette.background.default,
    maxWidth: 550,
    padding: '1rem'
  },
  subheader: {
    marginBottom: '1rem'
  },
  actions: {
    padding: '1rem 0',
    textAlign: 'end'
  }
}))

const Settings = () => {
  const classes = useStyles()
  const context = React.useContext(TranslateContext)
  // const langAvailables = Array.isArray(window?.langs) ? window?.langs : []

  const { scheme: currentScheme } = useGeneral()
  const { updateUser } = useAuth()

  const [settings, setSettings] = React.useState({
    scheme: currentScheme,
    lang: context.lang
  })

  const handleChange = evt => {
    evt.preventDefault()
    evt.persist()

    setSettings(prev => ({
      ...prev,
      [evt.target.name]: evt.target.value
    }))
  }

  const handleSubmit = evt => {
    evt.preventDefault()

    const values = Object.entries(settings)
      .map(([key, value]) => `\n ${String(key).toUpperCase()} = "${value}"`)

    console.log({values})

    updateUser({
      template: `FIREEDGE = [\n SCHEME = "${scheme}",\n LANG = "${lang}" ]\n`
    }).then(() => context.changeLang(lang))
  }

  return (
    <Container disableGutters>
      <div className={classes.header}>
        <Typography variant='h5' className={classes.title}>
          {Tr(T.Settings)}
        </Typography>
      </div>

      <hr />

      <Paper className={classes.wrapper} variant='outlined'>
        <Typography variant='overline' component='div' className={classes.subheader}>
          {`${Tr(T.Configuration)} UI`}
        </Typography>
        <TextField
          id='select-scheme-type'
          select
          fullWidth
          name='scheme'
          color='secondary'
          label='Scheme'
          value={settings.scheme}
          onChange={handleChange}
          SelectProps={{
            native: true
          }}
          variant='outlined'
        >
          <option value={Setting.SCHEMES.LIGHT}>{T.Light}</option>
          <option value={Setting.SCHEMES.DARK}>{T.Dark}</option>
          <option value={Setting.SCHEMES.SYSTEM}>{T.System}</option>
        </TextField>

        {/* is not operative yet */}
        {/* <Select
              color='secondary'
              inputProps={{
                name: 'lang',
                id: 'select-lang',
                'data-cy': 'select-lang'
              }}
              onChange={handleChange}
              fullWidth
              native
              value={lang}
              variant='outlined'
            >
              {langAvailables.map(({ key, value }) => (
                <option value={key} key={key}>
                  {value}
                </option>
              ))}
            </Select> */}
        <div className={classes.actions}>
          <SubmitButton
            color='secondary'
            data-cy='settings-submit-button'
            label={Tr(T.Save)}
            onClick={handleSubmit}
          />
        </div>
      </Paper>
    </Container>
  )
}

export default Settings
