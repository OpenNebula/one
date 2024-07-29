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
import FormWithSchema from 'client/components/Forms/FormWithSchema'
import PropTypes from 'prop-types'
import { FIELDS } from './schema'

export const STEP_ID = 'datastores'

const DatastoreTable = ({ zones, id, cluster, zone }) => (
  <FormWithSchema
    id={id}
    cy={`${STEP_ID}`}
    fields={FIELDS(zones, cluster, zone)}
  />
)

DatastoreTable.propTypes = {
  zones: PropTypes.arrayOf(PropTypes.object),
  id: PropTypes.string,
  zone: PropTypes.arrayOf(PropTypes.object),
  cluster: PropTypes.arrayOf(PropTypes.object),
}
const DatastoreResource = {
  id: STEP_ID,
  Content: DatastoreTable,
}

export default DatastoreResource
