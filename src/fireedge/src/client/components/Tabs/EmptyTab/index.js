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
import { ReactElement } from 'react'
import { InfoEmpty } from 'iconoir-react'

import { Translate } from 'client/components/HOC/Translate'
import { useStyles } from 'client/components/Tabs/EmptyTab/styles'

import { T } from 'client/constants'

/**
 * Renders default empty tab.
 *
 * @param {object} props - Props
 * @param {string} props.label - label string
 * @returns {ReactElement} Empty tab
 */
const EmptyTab = ({ label = T.NoDataAvailable }) => {
  const classes = useStyles()

  return (
    <span className={classes.noDataMessage}>
      <InfoEmpty />
      <Translate word={label} />
    </span>
  )
}
EmptyTab.propTypes = {
  label: PropTypes.string,
}
EmptyTab.displayName = 'EmptyTab'

export default EmptyTab
