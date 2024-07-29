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
import { ReactElement, memo, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Link as RouterLink, generatePath } from 'react-router-dom'
import { Box, Typography, Link, CircularProgress } from '@mui/material'

import { useGetServiceTemplateQuery } from 'client/features/OneApi/serviceTemplate'
import { useGetTemplatesQuery } from 'client/features/OneApi/vmTemplate'
import { Translate } from 'client/components/HOC'
import { T, Role } from 'client/constants'
import { PATH } from 'client/apps/sunstone/routesOne'

const COLUMNS = [T.Name, T.Cardinality, T.VMTemplate, T.Parents]

/**
 * Renders roles tab.
 *
 * @param {object} props - Props
 * @param {string} props.id - Service Template id
 * @returns {ReactElement} Roles tab
 */
const RolesTab = ({ id }) => {
  const { data: template = {} } = useGetServiceTemplateQuery({ id })
  const roles = template?.TEMPLATE?.BODY?.roles || []

  return (
    <Box
      display="grid"
      gridTemplateColumns="repeat(4, 1fr)"
      padding="1em"
      bgcolor="background.default"
    >
      {COLUMNS.map((col) => (
        <Typography key={col} noWrap variant="subtitle1" padding="0.5em">
          <Translate word={col} />
        </Typography>
      ))}
      {roles.map((role, idx) => (
        <Box
          key={`role-${role.name ?? idx}`}
          display="contents"
          padding="0.5em"
          // hover except for the circular progress component
          sx={{ '&:hover > *:not(span)': { bgcolor: 'action.hover' } }}
        >
          <RoleComponent role={role} />
        </Box>
      ))}
    </Box>
  )
}

RolesTab.propTypes = { tabProps: PropTypes.object, id: PropTypes.string }
RolesTab.displayName = 'RolesTab'

const RoleComponent = memo(({ role }) => {
  /** @type {Role} */
  const { name, cardinality, vm_template: templateId, parents } = role

  const { data: template, isLoading } = useGetTemplatesQuery(undefined, {
    selectFromResult: ({ data = [], ...restOfQuery }) => ({
      data: data.find((item) => +item.ID === +templateId),
      ...restOfQuery,
    }),
  })

  const linkToVmTemplate = useMemo(
    () => generatePath(PATH.TEMPLATE.VMS.DETAIL, { id: templateId }),
    [templateId]
  )

  const commonProps = { noWrap: true, variant: 'subtitle2', padding: '0.5em' }

  return (
    <>
      <Typography {...commonProps} data-cy="name">
        {name}
      </Typography>
      <Typography {...commonProps} data-cy="cardinality">
        {cardinality}
      </Typography>
      {isLoading ? (
        <CircularProgress color="secondary" size={20} />
      ) : (
        <Link
          {...commonProps}
          color="secondary"
          component={RouterLink}
          to={linkToVmTemplate}
        >
          {`#${template?.ID} ${template?.NAME}`}
        </Link>
      )}
      <Typography {...commonProps} data-cy="parents">
        {parents?.join?.()}
      </Typography>
    </>
  )
})

RoleComponent.propTypes = { role: PropTypes.object }
RoleComponent.displayName = 'RoleComponent'

export default RolesTab
