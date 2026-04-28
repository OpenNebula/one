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
import { Grid, useTheme, Alert } from '@mui/material'
import styles from '@modules/components/Forms/OneKs/CreateOneKsClusterForm/Steps/styles'
import FormWithSchema from '@modules/components/Forms/FormWithSchema'
import { Tr } from '@modules/components/HOC'

export const STEP_ID = 'kubernetes_version'

const Content = (families) => {
  // Theme
  const theme = useTheme()
  // Style classes
  const classes = useMemo(() => styles(theme), [theme])

  return (
    <>
      <Alert severity="info" variant="outlined" className={classes.groupInfo}>
        {Tr(T['oneks.form.create.kubernetes_version.info'])}
      </Alert>
      <Grid container mt={2} className={classes.container}>
        <Grid item xs={12}>
          <FormWithSchema
            id={STEP_ID}
            cy={`${STEP_ID}`}
            fields={FIELDS(families)}
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
