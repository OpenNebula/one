/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import PropTypes from 'prop-types'
import FormWithSchema from '@modules/components/Forms/FormWithSchema'
import { T } from '@ConstantsModule'
import { SCHEMA, FIELDS } from './schema'
import { useMemo } from 'react'
import { Grid, Alert, useTheme, Stack } from '@mui/material'
import { Tr } from '@modules/components/HOC'
import styles from '@modules/components/Forms/OneKs/CreateOneKsClusterForm/Steps/styles'

export const STEP_ID = 'general'

const Content = () => {
  // Theme
  const theme = useTheme()
  // Style classes
  const classes = useMemo(() => styles(theme), [theme])

  return (
    <>
      <Alert severity="info" variant="outlined" className={classes.groupInfo}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          justifyContent="space-between"
        >
          <div>
            {Tr(T['oneks.form.create_nodegroup.general.help.paragraph'])}
          </div>
        </Stack>
      </Alert>
      <Grid mt={2} container className={classes.container}>
        <Grid item xs={12}>
          <FormWithSchema id={STEP_ID} cy={`${STEP_ID}`} fields={FIELDS()} />
        </Grid>
      </Grid>
    </>
  )
}

/**
 * General Cluster configuration.
 *
 * @returns {object} General configuration step
 */
const General = () => ({
  id: STEP_ID,
  label: T.General,
  resolver: SCHEMA(),
  optionsValidate: { abortEarly: false },
  content: () => Content(),
})

General.propTypes = {
  families: PropTypes.array,
}

export default General
