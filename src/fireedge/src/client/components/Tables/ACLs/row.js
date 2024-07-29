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
/* eslint-disable jsdoc/require-jsdoc */
import PropTypes from 'prop-types'
import {
  ACLCardIcons,
  ACLCardNames,
  ACLCardCLI,
  ACLCardResources,
  ACLCardRule,
  ACLCardReadableRule,
} from 'client/components/Cards'
import { ACL_TABLE_VIEWS } from 'client/constants'

const Row = (viewType) => {
  const aclRow = ({ original, value, ...props }) => {
    // Check what view show in the table cards
    if (viewType === ACL_TABLE_VIEWS.NAMES.type) {
      return <ACLCardNames rootProps={props} acl={value} />
    } else if (viewType === ACL_TABLE_VIEWS.CLI.type) {
      return <ACLCardCLI rootProps={props} acl={value} />
    } else if (viewType === ACL_TABLE_VIEWS.RESOURCES.type) {
      return <ACLCardResources rootProps={props} acl={value} />
    } else if (viewType === ACL_TABLE_VIEWS.RULE.type) {
      return <ACLCardRule rootProps={props} acl={value} />
    } else if (viewType === ACL_TABLE_VIEWS.READABLERULE.type) {
      return <ACLCardReadableRule rootProps={props} acl={value} />
    } else {
      return <ACLCardIcons rootProps={props} acl={value} />
    }
  }

  aclRow.displayName = 'aclRow'
  aclRow.propTypes = {
    original: PropTypes.object,
    value: PropTypes.object,
  }

  return aclRow
}

Row.displayName = 'Row'

Row.propTypes = {
  viewType: PropTypes.func,
}

export default Row
