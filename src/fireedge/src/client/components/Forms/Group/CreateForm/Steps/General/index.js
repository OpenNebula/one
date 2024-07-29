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
import PropTypes from 'prop-types'
import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { T } from 'client/constants'
import { SCHEMA, FIELDS } from './schema'
import { Stack, Alert } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import { Tr } from 'client/components/HOC'

export const STEP_ID = 'general'

const Content = () => {
  // Style for info message
  const useStyles = makeStyles(({ palette }) => ({
    groupInfo: {
      '&': {
        gridColumn: 'span 2',
        marginTop: '1em',
        backgroundColor: palette.background.paper,
      },
    },
  }))

  const classes = useStyles()

  return (
    <Stack
      display="grid"
      gap="1em"
      sx={{
        gridTemplateColumns: { sm: '1fr', md: '1fr 1fr' },
        padding: '0.5 em',
      }}
    >
      <Alert severity="info" variant="outlined" className={classes.groupInfo}>
        {Tr(T['groups.general.info'])}
      </Alert>
      <FormWithSchema id={STEP_ID} cy={`${STEP_ID}`} fields={FIELDS} />
    </Stack>
  )
}

/**
 * General Group configuration.
 *
 * @returns {object} General configuration step
 */
const General = () => ({
  id: STEP_ID,
  label: T.General,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: Content,
})

General.propTypes = {
  data: PropTypes.object,
  setFormData: PropTypes.func,
}

export default General
