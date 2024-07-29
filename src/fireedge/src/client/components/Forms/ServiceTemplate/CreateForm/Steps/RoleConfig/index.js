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
import { useState, useRef, Component } from 'react'
import _ from 'lodash'
import { useFormContext, useForm, FormProvider } from 'react-hook-form'
import { Box, Button, Grid } from '@mui/material'
import { SCHEMA } from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/RoleConfig/schema'
import RoleColumn from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/Roles/rolesColumn'
import RoleSummary from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/Roles/roleSummary'
import RoleNetwork from './roleNetwork'
import { STEP_ID as ROLE_DEFINITION_ID } from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/Roles'
import ElasticityPoliciesSection from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/RoleConfig/ElasticityPolicies'
import ScheduledPoliciesSection from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/RoleConfig/ScheduledPolicies'
import AdvancedParametersSection from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/RoleConfig/AdvancedParameters'
import VmTemplatesPanel from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/Roles/vmTemplatesPanel'
import MinMaxSection from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/RoleConfig/MinMaxVms'
import { Translate } from 'client/components/HOC'
import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { Legend } from 'client/components/Forms'
import { yupResolver } from '@hookform/resolvers/yup'
import { INPUT_TYPES, T } from 'client/constants'
import { AddCircledOutline } from 'iconoir-react'
import { Field, getObjectSchemaFromFields } from 'client/utils'
import { string, number } from 'yup'

export const STEP_ID = 'roleconfig'

/** @type {Field} STANDALONE Name field */
const STANDALONE_NAME_FIELD = {
  name: `${STEP_ID}.name`,
  label: T.Name,
  cy: 'role',
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .min(3, 'Role name cannot be less than 3 characters')
    .max(128, 'Role name cannot be over 128 characters')
    .required('Role name cannot be empty')
    .default(() => undefined),
  grid: { md: 8 },
}

/** @type {Field} STANDALONE Cardinality field */
const STANDALONE_CARDINALITY_FIELD = {
  name: `${STEP_ID}.cardinality`,
  label: T.NumberOfVms,
  cy: 'role',
  type: INPUT_TYPES.TEXT,
  fieldProps: {
    type: 'number',
  },
  validation: number()
    .positive('Number of VMs must be positive')
    .default(() => 1),
  grid: { md: 4 },
}

const STANDALONE_SCHEMA = getObjectSchemaFromFields([
  STANDALONE_NAME_FIELD,
  STANDALONE_CARDINALITY_FIELD,
])

/**
 * @param {object} root0 - Props
 * @param {boolean} root0.standaloneModal - Run as standalone modal
 * @param {Function} root0.standaloneModalCallback - API callback function
 * @param {object} root0.fetchedVmTemplates - Fetched VM templates
 * @returns {Component} - Role configuration component
 */
export const Content = ({
  standaloneModal = false,
  standaloneModalCallback = () => {},
  fetchedVmTemplates = {},
}) => {
  const { vmTemplates, error } = fetchedVmTemplates
  const [standaloneRole, setStandaloneRole] = useState([
    { SELECTED_VM_TEMPLATE_ID: [] },
  ])

  const HANDLE_VM_SELECT_STANDALONE_ROLE = (updatedRole) => {
    setStandaloneRole(updatedRole)
  }

  const formMethods = standaloneModal
    ? useForm({
        defaultValues: SCHEMA.concat(STANDALONE_SCHEMA).default(),
        resolver: yupResolver(STANDALONE_SCHEMA),
        mode: 'onChange',
      })
    : useFormContext()
  const { getValues, setValue } = formMethods

  const handleAddRoleClick = async () => {
    const role = getValues(STEP_ID)

    const formatRole = {
      name: role?.name,
      cardinality: role?.cardinality,
      vm_template: standaloneRole?.SELECTED_VM_TEMPLATE_ID?.[0],
      ...(role?.ADVANCEDPARAMS?.SHUTDOWNTYPE && {
        shutdown_type: role.ADVANCEDPARAMS.SHUTDOWNTYPE,
      }),
      min_vms: +role?.MINMAXVMS?.[0]?.min_vms,
      max_vms: +role?.MINMAXVMS?.[0]?.max_vms,
      cooldown: role?.MINMAXVMS?.[0]?.cooldown,
      ...(role?.ELASTICITYPOLICIES && {
        elasticity_policies: role?.ELASTICITYPOLICIES?.[0],
      }),

      ...(role?.SCHEDULEDPOLICIES && {
        scheduled_policies: role?.SCHEDULEDPOLICIES?.[0],
      }),
    }
    standaloneModalCallback({ role: formatRole })
  }

  const definedConfigs = getValues(`${STEP_ID}.ROLES`)
  const roleConfigs = useRef(definedConfigs ?? [])

  /**
   *
   */
  const syncFormState = () => {
    setValue(`${STEP_ID}.ROLES`, roleConfigs.current)
  }

  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0)
  const roles = getValues(ROLE_DEFINITION_ID)

  const handleConfigChange = (operationType, config, shouldReset = false) => {
    const configKey = Object.keys(config)[0]
    const configValue = Object.values(config)[0]

    _.defaultsDeep(roleConfigs.current, {
      [selectedRoleIndex]: { [configKey]: [] },
    })

    switch (operationType) {
      case 'add':
        _.get(roleConfigs.current, [selectedRoleIndex, configKey]).push(
          configValue
        )
        break
      case 'remove':
        _.remove(
          _.get(roleConfigs.current, [selectedRoleIndex, configKey]),
          (_v, index) => index === configValue
        )
        break
      case 'update':
        _.set(
          roleConfigs.current,
          [selectedRoleIndex, configKey, 0],
          configValue
        )
        break
    }

    syncFormState()
  }

  const ComponentContent = (
    <Grid mt={2} container>
      {!standaloneModal && (
        <Grid item xs={2.2}>
          <RoleColumn
            roles={roles}
            selectedRoleIndex={selectedRoleIndex}
            setSelectedRoleIndex={setSelectedRoleIndex}
            disableModify={true}
            onChange={handleConfigChange}
          />
        </Grid>
      )}
      <Grid item xs={standaloneModal ? 12 : 7}>
        <Box
          margin={1}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
          }}
        >
          {!standaloneModal && (
            <RoleNetwork
              stepId={STEP_ID}
              selectedRoleIndex={selectedRoleIndex}
              totalRoles={roles?.length}
            />
          )}
          <Box mt={2}>
            <Legend title={T.RoleElasticity} />
            {standaloneModal && (
              <Box>
                <FormWithSchema
                  fields={[STANDALONE_NAME_FIELD, STANDALONE_CARDINALITY_FIELD]}
                />
              </Box>
            )}

            {standaloneModal && (
              <Box>
                <VmTemplatesPanel
                  roles={[standaloneRole]}
                  selectedRoleIndex={selectedRoleIndex}
                  onChange={HANDLE_VM_SELECT_STANDALONE_ROLE}
                  vmTemplates={vmTemplates}
                  error={error}
                />
              </Box>
            )}
            <MinMaxSection
              stepId={STEP_ID}
              selectedRoleIndex={selectedRoleIndex}
            />
            <ElasticityPoliciesSection
              stepId={STEP_ID}
              selectedRoleIndex={selectedRoleIndex}
            />
            <ScheduledPoliciesSection
              stepId={STEP_ID}
              selectedRoleIndex={selectedRoleIndex}
            />
          </Box>
          <Box mt={2}>
            <Legend title={T.Extra} />
            <AdvancedParametersSection
              stepId={STEP_ID}
              roleConfigs={roleConfigs.current?.[selectedRoleIndex]}
              onChange={handleConfigChange}
            />
          </Box>

          {standaloneModal && (
            <Box>
              <Button
                variant="contained"
                size="large"
                type="submit"
                color="secondary"
                startIcon={<AddCircledOutline />}
                data-cy={'roleconfig-addrole'}
                onClick={handleAddRoleClick}
                sx={{ width: '100%', mt: 2 }}
              >
                <Translate word={T.AddRole} />
              </Button>
            </Box>
          )}
        </Box>
      </Grid>

      {!standaloneModal && (
        <Grid item xs={2.8}>
          <RoleSummary
            role={roles?.[selectedRoleIndex] ?? []}
            selectedRoleIndex={selectedRoleIndex}
          />
        </Grid>
      )}
    </Grid>
  )

  return standaloneModal ? (
    <FormProvider {...formMethods}>{ComponentContent}</FormProvider>
  ) : (
    ComponentContent
  )
}

Content.propTypes = {
  standaloneModal: PropTypes.bool,
  standaloneModalCallback: PropTypes.func,
  fetchedVmTemplates: PropTypes.object,
}

/**
 * Role definition configuration.
 *
 * @returns {object} Roles definition configuration step
 */
const RoleConfig = () => ({
  id: STEP_ID,
  label: 'Role Configuration',
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: Content,
})
RoleConfig.propTypes = {
  data: PropTypes.array,
  setFormData: PropTypes.func,
}

export default RoleConfig
