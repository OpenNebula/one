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
import { useMemo, Component } from 'react'
import { useTheme } from '@mui/material'
import { rowStyles } from '@modules/components/Tables/styles'

/**
 * ACLCardCLI component to display ACL details.
 *
 * @param {object} props - Component props
 * @param {object} props.acl - ACL details
 * @param {object} props.rootProps - Additional props for the root element
 * @returns {Component} UserCard component
 */
const ACLCardCLI = ({ acl, rootProps }) => {
  const theme = useTheme()
  const { ID, STRING } = acl

  // Row styles
  const classes = useMemo(() => rowStyles(theme), [theme])

  return (
    <div {...rootProps} data-cy={`acl-${ID}`}>
      <div className={classes.main}>
        <div className={classes.title}>
          <span data-cy="acl-card-string">{`${STRING}`}</span>
        </div>
        <div className={classes.caption}>
          <span data-cy="acl-card-id">{`#${ID}`}</span>
        </div>
      </div>
    </div>
  )
}

ACLCardCLI.propTypes = {
  acl: PropTypes.shape({
    ID: PropTypes.string.isRequired,
    STRING: PropTypes.string.isRequired,
  }).isRequired,
  rootProps: PropTypes.shape({
    className: PropTypes.string,
  }),
}

ACLCardCLI.displayName = 'ACLCardCLI'

export default ACLCardCLI
