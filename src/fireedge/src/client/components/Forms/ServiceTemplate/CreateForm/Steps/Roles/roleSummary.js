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
import { Card, CardContent, Typography, Divider } from '@mui/material'
import PropTypes from 'prop-types'
import { T } from 'client/constants'
import { Tr } from 'client/components/HOC'
import { Component } from 'react'
/**
 * RoleSummary displays detailed information about a VM role, including its configuration and affinity settings.
 *
 * @param {object} props - The props that control the RoleSummary component.
 * @param {object} props.role - The role object containing the role's configuration.
 * @param {number} props.selectedRoleIndex - The index of the selected role.
 * @returns {Component} - Role summary component.
 */
const RoleSummary = ({ role, selectedRoleIndex }) => {
  const translations = {
    template: Tr(T.VMTemplate) + ' ' + Tr(T.ID),
    selectTemplate: Tr(T.SelectVmTemplate),
  }

  return (
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
          #{selectedRoleIndex + 1 ?? 0} {Tr(T.RoleConfiguration)}
        </Typography>

        <Typography
          variant="body2"
          color={role?.NAME ? 'text.primary' : 'text.disabled'}
          gutterBottom
        >
          {Tr(T.Name)}: {role?.NAME || Tr(T.RoleEnterName)}
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
          {Tr(T.NumberOfVms)}: {role?.CARDINALITY}
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
              {translations.template}: {role?.SELECTED_VM_TEMPLATE_ID}
            </Typography>
          </>
        ) : (
          <Typography variant="body2" color="text.disabled" gutterBottom>
            {translations.selectTemplate}
          </Typography>
        )}
        <Divider />
        <Typography
          variant="body2"
          color={role?.NETWORKS ? 'text.primary' : 'text.disabled'}
          gutterBottom
        >
          {Tr(T.Networks)}: {role?.NETWORKS || ' ' + Tr(T.RoleSelectNetwork)}
        </Typography>

        <Typography color={'text.primary'} sx={{ fontSize: 16 }} gutterBottom>
          {Tr(T.RoleElasticity)}
        </Typography>

        <Typography
          variant="body2"
          color={role?.MINVMS ? 'text.primary' : 'text.disabled'}
          gutterBottom
        >
          {Tr(T.RolesMinVms)}:{role?.MINVMS || ' ' + Tr(T.RoleMinElasticity)}
        </Typography>

        <Typography
          variant="body2"
          color={role?.MAXVMS ? 'text.primary' : 'text.disabled'}
          gutterBottom
        >
          {Tr(T.RolesMaxVms)}:{role?.MAXVMS || ' ' + Tr(T.RoleMaxElasticity)}
        </Typography>

        <Typography
          variant="body2"
          color={role?.MAXVMS ? 'text.primary' : 'text.disabled'}
          gutterBottom
        >
          {Tr(T.Cooldown)}:{role?.COOLDOWN || ' ' + Tr(T.RoleDurationScale)}
        </Typography>

        <Typography
          color={role?.ELASTICITYPOLICIES ? 'text.primary' : 'text.disabled'}
          sx={{ fontSize: 14 }}
          gutterBottom
        >
          {Tr(T.ElasticityPolicies)}
        </Typography>

        <Typography
          variant="body2"
          color={
            role?.ELASTICITYPOLICIES?.TYPE ? 'text.primary' : 'text.disabled'
          }
          gutterBottom
        >
          {Tr(T.Type)}:
          {role?.ELASTICITYPOLICIES?.TYPE || ' ' + Tr(T.RoleAdjustmentType)}
        </Typography>

        <Typography
          variant="body2"
          color={
            role?.ELASTICITYPOLICIES?.ADJUST ? 'text.primary' : 'text.disabled'
          }
          gutterBottom
        >
          {Tr(T.Adjust)}:
          {role?.ELASTICITYPOLICIES?.ADJUST ||
            ' ' + Tr(T.RoleAdjustmentTypePositiveNegative)}
        </Typography>
      </CardContent>
    </Card>
  )
}

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
  onRemoveAffinity: PropTypes.func,
}

export default RoleSummary
