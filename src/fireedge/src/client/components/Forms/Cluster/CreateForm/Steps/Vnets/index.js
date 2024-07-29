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
import { Grid, Card, CardContent, Typography } from '@mui/material'
import { Tr } from 'client/components/HOC'
import { generateDocLink } from 'client/utils'

export const STEP_ID = 'vnets'

const Content = (version) => (
  <Grid mt={2} container>
    <Grid item xs={8}>
      <FormWithSchema id={STEP_ID} cy={`${STEP_ID}`} fields={FIELDS} />
    </Grid>
    <Grid item xs={4}>
      <Card
        elevation={2}
        sx={{
          height: '100%',
          minHeight: '630px',
          maxHeight: '630px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          marginLeft: '1em',
          marginTop: '1rem',
        }}
      >
        <CardContent
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '1em',
          }}
        >
          <Typography variant="h6" component="div" gutterBottom>
            {Tr(T['cluster.form.create.vnets.help.title'])}
          </Typography>
          <Typography variant="body2" gutterBottom>
            {Tr(T['cluster.form.create.vnets.help.paragraph.1'])}
          </Typography>
          <Typography variant="body2" gutterBottom>
            {Tr(T['cluster.form.create.vnets.help.paragraph.2'])}
          </Typography>
          <Typography variant="body2" gutterBottom>
            {' '}
            <a
              target="_blank"
              href={generateDocLink(
                version,
                'management_and_operations/host_cluster_management/cluster_guide.html'
              )}
              rel="noreferrer"
            >
              {Tr(T['cluster.form.create.help.link'])}
            </a>
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
)

/**
 * Vnets Cluster configuration.
 *
 * @param {object} props - Step properties
 * @param {string} props.version - OpeNebula version
 * @returns {object} Vnets configuration step
 */
const Vnets = ({ version }) => ({
  id: STEP_ID,
  label: T.SelectVirtualNetworks,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: () => Content(version),
})

Vnets.propTypes = {
  data: PropTypes.object,
  setFormData: PropTypes.func,
}

export default Vnets
