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
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Divider,
} from '@mui/material'
import PropTypes from 'prop-types'
import { T } from 'client/constants'
import { Component } from 'react'
/**
 * RoleSummary displays detailed information about a VM role, including its configuration and affinity settings.
 *
 * @param {object} props - The props that control the RoleSummary component.
 * @param {object} props.role - The role object containing the role's configuration.
 * @param {number} props.selectedRoleIndex - The index of the selected role.
 * @returns {Component} - Role summary component.
 */
const RoleSummary = ({ role, selectedRoleIndex }) => (
  <Card
    elevation={2}
    sx={{
      height: '100%',
      maxHeight: '630px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'auto',
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
        #{selectedRoleIndex + 1 ?? 0} Role Configuration
      </Typography>

      <Typography
        variant="body2"
        color={role?.NAME ? 'text.primary' : 'text.disabled'}
        gutterBottom
      >
        Name: {role?.NAME || 'Enter a name for this role.'}
      </Typography>

      <Typography
        variant="body2"
        color={
          role?.CARDINALITY === undefined ||
          role?.CARDINALITY === 'None' ||
          +role?.CARDINALITY < 1
            ? 'text.disabled'
            : 'text.primary'
        }
        gutterBottom
      >
        {T.NumberOfVms}: {role?.CARDINALITY}
      </Typography>

      {role?.SELECTED_VM_TEMPLATE_ID ? (
        <>
          <Typography
            variant="body2"
            color={
              role?.SELECTED_VM_TEMPLATE_ID === undefined ||
              role?.SELECTED_VM_TEMPLATE_ID === 'None' ||
              role?.SELECTED_VM_TEMPLATE_ID?.length < 1
                ? 'text.disabled'
                : 'text.primary'
            }
            gutterBottom
          >
            VM Template ID: {role?.SELECTED_VM_TEMPLATE_ID}
          </Typography>
        </>
      ) : (
        <Typography variant="body2" color="text.disabled" gutterBottom>
          Select a VM template.
        </Typography>
      )}
      <Divider />
      <Typography
        variant="body2"
        color={role?.NETWORKS ? 'text.primary' : 'text.disabled'}
        gutterBottom
      >
        Networks: {role?.NETWORKS || 'Select a network for this role.'}
      </Typography>

      <Typography color={'text.primary'} sx={{ fontSize: 16 }} gutterBottom>
        Role Elasticity
      </Typography>

      <Typography
        variant="body2"
        color={role?.MINVMS ? 'text.primary' : 'text.disabled'}
        gutterBottom
      >
        Min VMs:
        {role?.MINVMS || ' Minimum number of VMs for elasticity adjustments.'}
      </Typography>

      <Typography
        variant="body2"
        color={role?.MAXVMS ? 'text.primary' : 'text.disabled'}
        gutterBottom
      >
        Max VMs:
        {role?.MAXVMS || ' Maximum number of VMs for elasticity adjustments.'}
      </Typography>

      <Typography
        variant="body2"
        color={role?.MAXVMS ? 'text.primary' : 'text.disabled'}
        gutterBottom
      >
        Cooldown:
        {role?.COOLDOWN ||
          ' Duration after a scale operation in seconds. If it is not set, the default set in oneflow-server.conf will be used.'}
      </Typography>

      <Typography
        color={role?.ELASTICITYPOLICIES ? 'text.primary' : 'text.disabled'}
        sx={{ fontSize: 14 }}
        gutterBottom
      >
        Elasticity Policies
      </Typography>

      <Typography
        variant="body2"
        color={
          role?.ELASTICITYPOLICIES?.TYPE ? 'text.primary' : 'text.disabled'
        }
        gutterBottom
      >
        Type:
        {role?.ELASTICITYPOLICIES?.TYPE || ' Adjustment type'}
      </Typography>

      <Typography
        variant="body2"
        color={
          role?.ELASTICITYPOLICIES?.ADJUST ? 'text.primary' : 'text.disabled'
        }
        gutterBottom
      >
        Adjust:
        {role?.ELASTICITYPOLICIES?.ADJUST || ' Positive or negative adjustment'}
      </Typography>
    </CardContent>
    <CardActions sx={{ p: 2, pt: 0 }}>
      <Typography
        variant="subtitle2"
        color="textSecondary"
        sx={{ opacity: 0.7 }}
      >
        <strong>VM Group Configuration:</strong>
        <ul>
          <li>Define roles and placement constraints.</li>
          <li>Optimize performance and fault tolerance.</li>
          <li>Manage multi-VM applications efficiently.</li>
        </ul>
      </Typography>
    </CardActions>
  </Card>
)

RoleSummary.propTypes = {
  role: PropTypes.oneOfType([
    PropTypes.shape({
      NAME: PropTypes.string,
      POLICY: PropTypes.oneOf(['AFFINED', 'ANTI_AFFINED', 'None', undefined]),
      HOST_AFFINED: PropTypes.arrayOf(PropTypes.number),
      HOST_ANTI_AFFINED: PropTypes.arrayOf(PropTypes.number),
    }),
    PropTypes.array,
    PropTypes.object,
  ]),
  selectedRoleIndex: PropTypes.number,
  onRemoveAffinity: PropTypes.func.isRequired,
}

export default RoleSummary
