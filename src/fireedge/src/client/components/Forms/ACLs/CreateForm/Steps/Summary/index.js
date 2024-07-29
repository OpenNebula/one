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
import { T, ACL_TYPE_ID, ACL_RESOURCES } from 'client/constants'
import { Stack, Alert } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import { Tr } from 'client/components/HOC'
import { useFormContext } from 'react-hook-form'

import { createStringACL, translateACL } from 'client/models/ACL'
import { object } from 'yup'

import { generateDocLink } from 'client/utils'
export const STEP_ID = 'summary'

const Content = (version, users, groups, clusters, zones) => {
  const { getValues } = useFormContext()

  const values = getValues()

  const ruleString = createStringACL(
    ACL_TYPE_ID[values?.user?.TYPE],
    values?.user?.INDIVIDUAL ?? values?.user?.GROUP ?? values?.user?.CLUSTER,
    Object.keys(values?.resources)
      .filter((resource) => values?.resources[resource])
      .map((resource) => ACL_RESOURCES[resource]),
    ACL_TYPE_ID[values?.resourcesIdentifier?.TYPE],
    values?.resourcesIdentifier?.INDIVIDUAL ??
      values?.resourcesIdentifier?.GROUP ??
      values?.resourcesIdentifier?.CLUSTER,
    Object.keys(values?.rights).filter((key) => values?.rights[key]),
    values?.zone?.TYPE ? ACL_TYPE_ID[values?.zone?.TYPE] : undefined,
    values?.zone?.ZONE
  )

  // Style for info message
  const useStyles = makeStyles(({ palette }) => ({
    groupInfo: {
      '&': {
        gridColumn: 'span 2',
        marginTop: '1em',
        backgroundColor: palette.background.paper,
      },
    },
  }))

  const classes = useStyles()

  return (
    <Stack
      display="grid"
      gap="1em"
      sx={{
        gridTemplateColumns: { sm: '1fr', md: '1fr 1fr' },
        padding: '0.5 em',
      }}
    >
      <Alert severity="info" variant="outlined" className={classes.groupInfo}>
        {Tr(T['acls.form.create.summary.info.rule'])}
        <b data-cy="ruleString">{ruleString}</b>
        <br />
        <br />
        {Tr(T['acls.form.create.summary.info.translation'])}
        <b>{translateACL(ruleString, users, groups, clusters, zones)}</b>
        <br />
        <br />
        {Tr(T['acls.form.create.stringEditor.info.more'])}
        <a
          target="_blank"
          href={generateDocLink(
            version,
            'management_and_operations/users_groups_management/chmod.html#manage-acl#manage-acl'
          )}
          rel="noreferrer"
        >
          {Tr(T['acls.form.create.stringEditor.info.more.link'])}
        </a>
      </Alert>
    </Stack>
  )
}

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
  content: () => Content(version, users, groups, clusters, zones),
})

Summary.propTypes = {
  data: PropTypes.object,
  setFormData: PropTypes.func,
}

export default Summary
