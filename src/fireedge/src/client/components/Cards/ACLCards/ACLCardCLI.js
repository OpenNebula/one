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
import { Component } from 'react'

import { ACL_USERS } from 'client/constants'

import { rowStyles } from 'client/components/Tables/styles'

/**
 * ACLCardIcon component to display ACL details.
 *
 * @param {object} props - Component props
 * @param {object} props.acl - ACL details
 * @param {object} props.rootProps - Additional props for the root element
 * @returns {Component} UserCard component
 */
const ACLCardIcon = ({ acl, rootProps }) => {
  const {
    ID,
    idUserId,
    idUserType,
    resources,
    idResourceId,
    idResourceType,
    rights,
    zoneId,
    zoneType,
  } = acl

  // Row styles
  const classes = rowStyles()

  return (
    <div {...rootProps} data-cy={`acl-${ID}`}>
      <div className={classes.main}>
        <div
          className={classes.title}
          style={{ display: 'flex', width: '100%' }}
        >
          <div style={{ flex: '10%' }} data-cy="acl-card-user">
            <span>
              {ACL_USERS[idUserType].id}
              {idUserId}
            </span>
          </div>
          <div style={{ flex: '25%' }} data-cy="acl-card-resources">
            {resources.includes('VM') ? 'V' : '-'}
            {resources.includes('HOST') ? 'H' : '-'}
            {resources.includes('NET') ? 'N' : '-'}
            {resources.includes('IMAGE') ? 'I' : '-'}
            {resources.includes('USER') ? 'U' : '-'}
            {resources.includes('TEMPLATE') ? 'T' : '-'}
            {resources.includes('GROUP') ? 'G' : '-'}
            {resources.includes('DATASTORE') ? 'D' : '-'}
            {resources.includes('CLUSTER') ? 'C' : '-'}
            {resources.includes('DOCUMENT') ? 'O' : '-'}
            {resources.includes('ZONE') ? 'Z' : '-'}
            {resources.includes('SECGROUP') ? 'S' : '-'}
            {resources.includes('VDC') ? 'v' : '-'}
            {resources.includes('VROUTER') ? 'R' : '-'}
            {resources.includes('MARKETPLACE') ? 'M' : '-'}
            {resources.includes('MARKETPLACEAPP') ? 'A' : '-'}
            {resources.includes('VMGROUP') ? 'P' : '-'}
            {resources.includes('VNTEMPLATE') ? 't' : '-'}
            {resources.includes('BACKUPJOB') ? 'B' : '-'}
          </div>
          <div style={{ flex: '10%' }} data-cy="acl-card-resourcesIdentifier">
            <span>
              {ACL_USERS[idResourceType].id}
              {idResourceId}
            </span>
          </div>
          <div style={{ flex: '10%' }} data-cy="acl-card-rights">
            {rights.includes('USE') ? 'u' : '-'}
            {rights.includes('MANAGE') ? 'm' : '-'}
            {rights.includes('ADMIN') ? 'a' : '-'}
            {rights.includes('CREATE') ? 'c' : '-'}
          </div>
          <div style={{ flex: '10%' }} data-cy="acl-card-zone">
            <span>
              {ACL_USERS[zoneType].id}
              {zoneId}
            </span>
          </div>
        </div>
        <div className={classes.caption}>
          <span data-cy="acl-card-id">{`#${ID}`}</span>
        </div>
      </div>
    </div>
  )
}

ACLCardIcon.propTypes = {
  acl: PropTypes.shape({
    ID: PropTypes.string.isRequired,
    idUserId: PropTypes.string.isRequired,
    idUserName: PropTypes.string,
    idUserType: PropTypes.string.isRequired,
    resources: PropTypes.array.isRequired,
    idResourceId: PropTypes.string,
    idResourceName: PropTypes.string,
    idResourceType: PropTypes.string.isRequired,
    rights: PropTypes.array.isRequired,
    zoneId: PropTypes.string,
    zoneName: PropTypes.string,
    zoneType: PropTypes.string.isRequired,
  }).isRequired,
  rootProps: PropTypes.shape({
    className: PropTypes.string,
  }),
}

ACLCardIcon.displayName = 'ACLCardIcon'

export default ACLCardIcon
