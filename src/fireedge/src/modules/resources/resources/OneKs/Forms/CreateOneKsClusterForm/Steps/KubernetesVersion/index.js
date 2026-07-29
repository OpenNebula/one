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
import { T } from '@ConstantsModule'
import { SCHEMA, FIELDS } from './schema'
import { useMemo } from 'react'
import { Grid, useTheme } from '@mui/material'
import styles from '@modules/resources/resources/OneKs/Forms/CreateOneKsClusterForm/Steps/styles'
import { AlertNotification, FormWithSchema } from '@ComponentsV2Module'
import { useTranslation } from '@ProvidersModule'

export const STEP_ID = 'kubernetes_version'

const Content = (families) => {
  const { translate } = useTranslation()
  // Theme
  const theme = useTheme()
  // Style classes
  const classes = useMemo(() => styles(theme), [theme])
  const fields = FIELDS(families)
  const columns = [[], fields, []]

  return (
    <>
      <AlertNotification
        type="primary"
        status="information"
        description={translate(T['oneks.form.create.kubernetes_version.info'])}
        isDismissible={false}
        className={classes.groupInfo}
        style={{ width: '100%', boxSizing: 'border-box' }}
      />
      <Grid container mt={2} className={classes.container}>
        <Grid item xs={12}>
          <FormWithSchema
            id={STEP_ID}
            cy={`${STEP_ID}`}
            fields={fields}
            columns={columns}
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
 * Flavor Cluster configuration.
 *
 * @param {object} props - Step props
 * @param {Array} props.families - Step families
 * @returns {object} Kubernetes Version configuration step
 */
const KubernetesVersion = ({ families }) => ({
  id: STEP_ID,
  label: T.KubernetesVersion,
  resolver: SCHEMA(families),
  optionsValidate: { abortEarly: false },
  content: () => Content(families),
})

KubernetesVersion.propTypes = {
  families: PropTypes.array,
}

export default KubernetesVersion
