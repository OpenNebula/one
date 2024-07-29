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
import { Grid } from '@mui/material'
import HelperACL from 'client/components/Forms/ACLs/CreateForm/Utils/helper'

export const STEP_ID = 'rights'

const Content = (users, groups, clusters, zones, version) => (
  <Grid mt={2} container>
    <Grid item xs={8}>
      <FormWithSchema id={STEP_ID} cy={`${STEP_ID}`} fields={FIELDS} />
    </Grid>
    <Grid item xs={4}>
      <HelperACL
        title={T['acls.form.create.rights.title']}
        text={T['acls.form.create.rights.info']}
        users={users}
        groups={groups}
        clusters={clusters}
        zones={zones}
        version={version}
      />
    </Grid>
  </Grid>
)

/**
 * Rights ACL configuration.
 *
 * @param {object} props - Step props
 * @param {Array} props.users - List of users
 * @param {Array} props.groups - List of groups
 * @param {Array} props.clusters - List of clusters
 * @param {Array} props.zones - List of zones
 * @param {string} props.version - ONE version
 * @returns {object} Rights ACL configuration step
 */
const Rights = ({ users, groups, clusters, zones, version }) => ({
  id: STEP_ID,
  label: T['acls.form.create.rights.title'],
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: () => Content(users, groups, clusters, zones, version),
})

Rights.propTypes = {
  data: PropTypes.object,
  setFormData: PropTypes.func,
}

export default Rights
