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
import { AlertNotification, FormWithSchema } from '@ComponentsV2Module'
import { T } from '@ConstantsModule'
import { SCHEMA, FIELDS } from './schema'
import { useMemo } from 'react'
import { Grid, useTheme } from '@mui/material'
import { useTranslation } from '@ProvidersModule'
import styles from '@modules/resources/resources/OneKs/Forms/CreateOneKsClusterForm/Steps/styles'

export const STEP_ID = 'general'
const COLUMNS = [[], FIELDS, []]

const Content = () => {
  const { translate } = useTranslation()
  // Theme
  const theme = useTheme()
  // Style classes
  const classes = useMemo(() => styles(theme), [theme])

  return (
    <>
      <AlertNotification
        type="primary"
        status="information"
        description={translate(T['oneks.form.create.general.help.paragraph'])}
        isDismissible={false}
        className={classes.groupInfo}
        style={{ width: '100%', boxSizing: 'border-box' }}
      />
      <Grid mt={2} container className={classes.container}>
        <Grid item xs={12}>
          <FormWithSchema
            id={STEP_ID}
            cy={`${STEP_ID}`}
            fields={FIELDS}
            columns={COLUMNS}
            gridContainerSx={{
              gridTemplateColumns: { xs: '1fr', md: '1fr 2fr 1fr' },
            }}
          />
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
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: () => Content(),
})

export default General
