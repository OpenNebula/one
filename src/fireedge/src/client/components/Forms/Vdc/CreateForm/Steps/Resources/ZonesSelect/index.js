/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { JSXElementConstructor } from 'react'
import { FIELDS } from './schema'

export const STEP_ID = 'zone'

/**
 * @param {object} props - props
 * @param {Array} props.zones - zones
 * @param {string} props.id - form id
 * @returns {JSXElementConstructor} Provision App
 */
const ZoneSelect = ({ zones, id }) => (
  <FormWithSchema id={id} cy={`${STEP_ID}`} fields={FIELDS(zones)} />
)

ZoneSelect.propTypes = {
  zones: PropTypes.arrayOf(PropTypes.object),
  id: PropTypes.string,
}

export default ZoneSelect
