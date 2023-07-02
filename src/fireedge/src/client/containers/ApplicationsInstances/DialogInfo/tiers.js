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
/* eslint-disable jsdoc/require-jsdoc */
import PropTypes from 'prop-types'

import { ListCards } from 'client/components/List'
import { TierCard } from 'client/components/Cards'

const TiersTab = ({ info }) => {
  const { roles = [] } = info.TEMPLATE.BODY

  return <ListCards list={roles} CardComponent={TierCard} />
}

TiersTab.propTypes = {
  info: PropTypes.object.isRequired,
}

TiersTab.defaultProps = {
  info: {},
}

TiersTab.displayName = 'TiersTab'

export default TiersTab
