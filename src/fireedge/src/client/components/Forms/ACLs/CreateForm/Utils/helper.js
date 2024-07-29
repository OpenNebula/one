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
import { Card, CardContent, Typography } from '@mui/material'
import { Tr } from 'client/components/HOC'
import { T, ACL_TYPE_ID, ACL_RESOURCES } from 'client/constants'
import { useWatch } from 'react-hook-form'
import { useEffect, useState, Component } from 'react'
import { createStringACL, translateACL } from 'client/models/ACL'
import { generateDocLink } from 'client/utils'
import PropTypes from 'prop-types'

/**
 * Card with help texts and the ACL rule in a readable language.
 *
 * @param {object} props - Component props
 * @param {string} props.title - Card title
 * @param {string} props.text - Card text
 * @param {Array} props.users - List of users
 * @param {Array} props.groups - List of groups
 * @param {Array} props.clusters - List of clusters
 * @param {Array} props.zones - List of zones
 * @param {string} props.version - ONE version
 * @returns {Component} The HelperACL component.
 */
const HelperACL = ({
  title,
  text,
  users,
  groups,
  clusters,
  zones,
  version,
}) => {
  // Create rule
  const [rule, setRule] = useState('')

  // Watch form
  const watch = useWatch()

  // Create ACL when something changes on the form
  useEffect(() => {
    const ruleString = createStringACL(
      ACL_TYPE_ID[watch?.user?.TYPE],
      watch?.user?.INDIVIDUAL ?? watch?.user?.GROUP ?? watch?.user?.CLUSTER,
      Object.keys(watch?.resources)
        .filter((resource) => watch?.resources[resource])
        .map((resource) => ACL_RESOURCES[resource]),
      ACL_TYPE_ID[watch?.resourcesIdentifier?.TYPE],
      watch?.resourcesIdentifier?.INDIVIDUAL ??
        watch?.resourcesIdentifier?.GROUP ??
        watch?.resourcesIdentifier?.CLUSTER,
      Object.keys(watch?.rights).filter((key) => watch?.rights[key]),
      watch?.zone?.TYPE ? ACL_TYPE_ID[watch?.zone?.TYPE] : undefined,
      watch?.zone?.ZONE
    )

    setRule(ruleString)
  }, [watch])

  return (
    <Card
      elevation={2}
      sx={{
        height: '100%',
        minHeight: '630px',
        maxHeight: '630px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        marginLeft: '1em',
        marginTop: '1rem',
      }}
    >
      <CardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '1em',
        }}
      >
        <Typography variant="h6" component="div" gutterBottom>
          {Tr(title)}
        </Typography>

        <Typography variant="body2" gutterBottom>
          {Tr(text)}
        </Typography>

        <Typography variant="body2" gutterBottom>
          <b>{translateACL(rule, users, groups, clusters, zones)}</b>
        </Typography>

        <Typography variant="body2" gutterBottom>
          {Tr(T['acls.form.create.stringEditor.info.more'])}
          <a
            target="_blank"
            href={generateDocLink(
              version,
              'management_and_operations/users_groups_management/chmod.html#manage-acl'
            )}
            rel="noreferrer"
          >
            {Tr(T['acls.form.create.stringEditor.info.more.link'])}
          </a>
        </Typography>
      </CardContent>
    </Card>
  )
}

HelperACL.displayName = 'HelperACL'
HelperACL.propTypes = {
  title: PropTypes.string,
  text: PropTypes.string,
  users: PropTypes.array,
  groups: PropTypes.array,
  clusters: PropTypes.array,
  zones: PropTypes.array,
  version: PropTypes.string,
}

export default HelperACL
