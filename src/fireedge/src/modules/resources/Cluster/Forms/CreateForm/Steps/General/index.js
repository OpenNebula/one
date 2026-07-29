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
import { FormWithSchema } from '@ComponentsV2Module'
import { T } from '@ConstantsModule'
import { SCHEMA, FIELDS } from './schema'

export const STEP_ID = 'general'
const COLUMNS = [[], FIELDS, []]

const Content = () => (
  <FormWithSchema
    id={STEP_ID}
    cy={`${STEP_ID}`}
    fields={FIELDS}
    columns={COLUMNS}
    gridContainerSx={{
      gridTemplateColumns: { xs: '1fr', md: '1fr 2fr 1fr' },
    }}
  />
)

/**
 * General Cluster configuration.
 *
 * @param {object} props - Step properties
 * @param {string} props.version - OpeNebula version
 * @returns {object} General configuration step
 */
const General = ({ version }) => ({
  id: STEP_ID,
  label: T.General,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: Content,
  documentation: {
    title: T['cluster.form.create.general.help.title'],
    content: [
      T['cluster.form.create.general.help.paragraph.1.1'],
      T['cluster.form.create.general.help.paragraph.1.2'],
      T['cluster.form.create.general.help.paragraph.1.3'],
      T['cluster.form.create.general.help.paragraph.2'],
    ],
    link: 'management_and_operations/host_cluster_management/cluster_guide.html',
    version,
  },
})

General.propTypes = {
  data: PropTypes.object,
  setFormData: PropTypes.func,
  version: PropTypes.string,
}

export default General
