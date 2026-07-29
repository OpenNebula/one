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
import { Box, Link, Stack } from '@mui/material'
import { AlertNotification } from '@ComponentsV2Module'
import { generateDocLink } from '@UtilsModule'
import { useTranslation } from '@ProvidersModule'
import { T, ACL_TYPE_ID, ACL_RESOURCES } from '@ConstantsModule'
import { useWatch } from 'react-hook-form'
import { createStringACL, translateACL } from '@ModelsModule'

import PropTypes from 'prop-types'

const ACL_DOC_LINK =
  'product/cloud_system_administration/multitenancy/chmod/#manage-acl'

const getACLRuleString = (values = {}) =>
  createStringACL(
    ACL_TYPE_ID[values?.user?.TYPE],
    values?.user?.INDIVIDUAL ?? values?.user?.GROUP ?? values?.user?.CLUSTER,
    Object.keys(values?.resources ?? {})
      .filter((resource) => values?.resources[resource])
      .map((resource) => ACL_RESOURCES[resource]),
    ACL_TYPE_ID[values?.resourcesIdentifier?.TYPE],
    values?.resourcesIdentifier?.INDIVIDUAL ??
      values?.resourcesIdentifier?.GROUP ??
      values?.resourcesIdentifier?.CLUSTER,
    Object.keys(values?.rights ?? {}).filter((key) => values?.rights[key]),
    values?.zone?.TYPE ? ACL_TYPE_ID[values?.zone?.TYPE] : undefined,
    values?.zone?.ZONE
  )

/**
 * Preview of the ACL rule being created.
 *
 * @param {object} props - Component props
 * @param {Array} props.users - List of users
 * @param {Array} props.groups - List of groups
 * @param {Array} props.clusters - List of clusters
 * @param {Array} props.zones - List of zones
 * @param {string} props.rule - ACL rule string to display
 * @returns {*} ACL rule preview
 */
const ACLRulePreview = ({ users, groups, clusters, zones, rule }) => {
  const { translate } = useTranslation()
  const values = useWatch()
  const ruleString = rule ?? getACLRuleString(values)

  return (
    <AlertNotification
      type="primary"
      status="information"
      title={`${translate(
        T['acls.form.create.summary.info.rule']
      )}${ruleString}`}
      description={`${translate(
        T['acls.form.create.summary.info.translation']
      )}${translateACL(ruleString, users, groups, clusters, zones)}`}
      isDismissible={false}
      data-cy="ruleString"
      style={{ marginBottom: '16px', width: '100%', boxSizing: 'border-box' }}
    />
  )
}

ACLRulePreview.propTypes = {
  users: PropTypes.array,
  groups: PropTypes.array,
  clusters: PropTypes.array,
  zones: PropTypes.array,
  rule: PropTypes.string,
}

const DocumentationLink = ({ version }) => {
  const { translate } = useTranslation()

  return (
    <Link
      target="_blank"
      href={generateDocLink(version, ACL_DOC_LINK)}
      rel="noreferrer"
      underline="hover"
    >
      {translate(T['acls.form.create.stringEditor.info.more.link'])}
    </Link>
  )
}

DocumentationLink.propTypes = {
  version: PropTypes.string,
}

/**
 * Documentation content for ACL wizard steps.
 *
 * @param {object} props - Component props
 * @param {string} props.text - Step help text
 * @param {string} props.version - ONE version
 * @returns {*} ACL documentation content
 */
const ACLDocumentation = ({ text, version }) => {
  const { translate } = useTranslation()

  return (
    <Stack gap="1em">
      <Box>{translate(text)}</Box>
      <Box>
        {translate(T['acls.form.create.stringEditor.info.more'])}
        <DocumentationLink version={version} />
      </Box>
    </Stack>
  )
}

ACLDocumentation.propTypes = {
  text: PropTypes.string,
  version: PropTypes.string,
}

/**
 * Documentation content for ACL summary step.
 *
 * @param {object} props - Component props
 * @param {string} props.version - ONE version
 * @returns {*} ACL summary documentation content
 */
const ACLSummaryDocumentation = ({ version }) => {
  const { translate } = useTranslation()

  return (
    <Stack gap="1em">
      <Box>
        {translate(T['acls.form.create.stringEditor.info.more'])}
        <DocumentationLink version={version} />
      </Box>
    </Stack>
  )
}

ACLSummaryDocumentation.propTypes = {
  version: PropTypes.string,
}

/**
 * Documentation content for ACL string editor step.
 *
 * @param {object} props - Component props
 * @param {string} props.version - ONE version
 * @returns {*} ACL string editor documentation content
 */
const ACLStringRuleDocumentation = ({ version }) => {
  const { translate } = useTranslation()

  return (
    <Stack gap="1em">
      <Box>{translate(T['acls.form.create.stringEditor.info'])}</Box>
      <Box component="ul" sx={{ my: 0, pl: 4 }}>
        <li>
          <Box component="strong">
            {translate(T['acls.form.create.stringEditor.info.user.title'])}
          </Box>
          {translate(T['acls.form.create.stringEditor.info.user.info'])}
        </li>
        <li>
          <Box component="strong">
            {translate(T['acls.form.create.stringEditor.info.resource.title'])}
          </Box>
          {translate(T['acls.form.create.stringEditor.info.resource.info'])}
        </li>
        <li>
          <Box component="strong">
            {translate(T['acls.form.create.stringEditor.info.rights.title'])}
          </Box>
          {translate(T['acls.form.create.stringEditor.info.rights.info'])}
        </li>
        <li>
          <Box component="strong">
            {translate(T['acls.form.create.stringEditor.info.zone.title'])}
          </Box>
          {translate(T['acls.form.create.stringEditor.info.zone.info'])}
        </li>
      </Box>
      <Box>
        {translate(T['acls.form.create.stringEditor.info.more'])}
        <DocumentationLink version={version} />
      </Box>
    </Stack>
  )
}

ACLStringRuleDocumentation.propTypes = {
  version: PropTypes.string,
}

export {
  ACLDocumentation,
  ACLRulePreview,
  ACLSummaryDocumentation,
  ACLStringRuleDocumentation,
  ACL_DOC_LINK,
}
