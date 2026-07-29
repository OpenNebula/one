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
import { Grid } from '@mui/material'
import { T } from '@ConstantsModule'
import {
  ACLRulePreview,
  ACLSummaryDocumentation,
} from '@modules/resources/resources/ACLs/Forms/CreateForm/Utils/helper'
import { object } from 'yup'

export const STEP_ID = 'summary'

const Content = (users, groups, clusters, zones) => (
  <Grid mt={2} container>
    <Grid item xs={12}>
      <ACLRulePreview
        users={users}
        groups={groups}
        clusters={clusters}
        zones={zones}
      />
    </Grid>
  </Grid>
)

/**
 * Summary ACL configuration.
 *
 * @param {object} props - Step props
 * @param {string} props.version - ONE version
 * @param {Array} props.users - List of users
 * @param {Array} props.groups - List of groups
 * @param {Array} props.clusters - List of clusters
 * @param {Array} props.zones - List of zones
 * @returns {object} Summary ACL configuration step
 */
const Summary = ({ version, users, groups, clusters, zones }) => ({
  id: STEP_ID,
  label: T['acls.form.create.summary.title'],
  resolver: object(),
  optionsValidate: { abortEarly: false },
  content: () => Content(users, groups, clusters, zones),
  documentation: {
    title: T['acls.form.create.summary.title'],
    content: () => <ACLSummaryDocumentation version={version} />,
    link: 'product/cloud_system_administration/multitenancy/chmod/#manage-acl',
    version,
  },
})

Summary.propTypes = {
  data: PropTypes.object,
  setFormData: PropTypes.func,
}

export default Summary
