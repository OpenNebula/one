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
import {
  Server as ClusterIcon,
  Db as DatastoreIcon,
  Folder as VmGroupIcon,
  Group as GroupIcon,
  HardDrive as HostIcon,
  BoxIso as ImageIcon,
  CloudDownload as MarketplaceAppIcon,
  SimpleCart as MarketplaceIcon,
  NetworkAlt as NetworkIcon,
  HistoricShield as SecurityGroupIcon,
  Packages as ServicesIcon,
  EmptyPage as TemplateIcon,
  User as UserIcon,
  List as VDCIcon,
  Shuffle as VRoutersIcons,
  ModernTv as VmsIcons,
  MinusPinAlt as ZoneIcon,
  Globe as AllIcon,
  ClockOutline as BackupJobsIcon,
} from 'iconoir-react'

import PropTypes from 'prop-types'
import { Component } from 'react'
import { Typography, Tooltip } from '@mui/material'

import { ACL_USERS, T } from 'client/constants'

import { Tr } from 'client/components/HOC'
import { rowStyles } from 'client/components/Tables/styles'
import { aclStyles } from 'client/components/Cards/ACLCards/styles'

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
    idUserName,
    idUserType,
    resources,
    idResourceId,
    idResourceName,
    idResourceType,
    rights,
    zoneName,
    zoneType,
  } = acl

  // Row styles
  const classes = rowStyles()

  // ACL card styles
  const aclClasses = aclStyles()

  return (
    <div {...rootProps} data-cy={`acl-${ID}`}>
      <div className={classes.main}>
        <div className={`${classes.title}`}>
          <Typography noWrap component="span" data-cy="acl-card-icons">
            {resources.includes('VM') && (
              <Tooltip title={Tr(T.VMs)}>
                <VmsIcons
                  data-cy="acl-card-icon-VM"
                  className={aclClasses.aclApplies}
                />
              </Tooltip>
            )}
            {resources.includes('HOST') && (
              <Tooltip title={Tr(T.Hosts)}>
                <HostIcon
                  data-cy="acl-card-icon-HOST"
                  className={aclClasses.aclApplies}
                />
              </Tooltip>
            )}
            {resources.includes('NET') && (
              <Tooltip title={Tr(T.Networks)}>
                <NetworkIcon
                  data-cy="acl-card-icon-NET"
                  className={aclClasses.aclApplies}
                />
              </Tooltip>
            )}
            {resources.includes('IMAGE') && (
              <Tooltip title={Tr(T.Images)}>
                <ImageIcon
                  data-cy="acl-card-icon-IMAGE"
                  className={aclClasses.aclApplies}
                />
              </Tooltip>
            )}
            {resources.includes('USER') && (
              <Tooltip title={Tr(T.Users)}>
                <UserIcon
                  data-cy="acl-card-icon-USER"
                  className={aclClasses.aclApplies}
                />
              </Tooltip>
            )}
            {resources.includes('TEMPLATE') && (
              <Tooltip title={Tr(T.Templates)}>
                <TemplateIcon
                  data-cy="acl-card-icon-TEMPLATE"
                  className={aclClasses.aclApplies}
                />
              </Tooltip>
            )}
            {resources.includes('GROUP') && (
              <Tooltip title={Tr(T.Groups)}>
                <GroupIcon
                  data-cy="acl-card-icon-GROUP"
                  className={aclClasses.aclApplies}
                />
              </Tooltip>
            )}
            {resources.includes('DATASTORE') && (
              <Tooltip title={Tr(T.Datastores)}>
                <DatastoreIcon
                  data-cy="acl-card-icon-DATASTORE"
                  className={aclClasses.aclApplies}
                />
              </Tooltip>
            )}
            {resources.includes('CLUSTER') && (
              <Tooltip title={Tr(T.Clusters)}>
                <ClusterIcon
                  data-cy="acl-card-icon-CLUSTER"
                  className={aclClasses.aclApplies}
                />
              </Tooltip>
            )}
            {resources.includes('DOCUMENT') && (
              <Tooltip title={Tr(T.Services)}>
                <ServicesIcon
                  data-cy="acl-card-icon-DOCUMENT"
                  className={aclClasses.aclApplies}
                />
              </Tooltip>
            )}
            {resources.includes('ZONE') && (
              <Tooltip title={Tr(T.Zones)}>
                <ZoneIcon
                  data-cy="acl-card-icon-ZONE"
                  className={aclClasses.aclApplies}
                />
              </Tooltip>
            )}
            {resources.includes('SECGROUP') && (
              <Tooltip title={Tr(T.SecurityGroups)}>
                <SecurityGroupIcon
                  data-cy="acl-card-icon-SECGROUP"
                  className={aclClasses.aclApplies}
                />
              </Tooltip>
            )}
            {resources.includes('VDC') && (
              <Tooltip title={Tr(T.VDCs)}>
                <VDCIcon
                  data-cy="acl-card-icon-VDC"
                  className={aclClasses.aclApplies}
                />
              </Tooltip>
            )}
            {resources.includes('VROUTER') && (
              <Tooltip title={Tr(T.VirtualRouters)}>
                <VRoutersIcons
                  data-cy="acl-card-icon-VROUTER"
                  className={aclClasses.aclApplies}
                />
              </Tooltip>
            )}
            {resources.includes('MARKETPLACE') && (
              <Tooltip title={Tr(T.Marketplaces)}>
                <MarketplaceAppIcon
                  data-cy="acl-card-icon-MARKETPLACE"
                  className={aclClasses.aclApplies}
                />
              </Tooltip>
            )}
            {resources.includes('MARKETPLACEAPP') && (
              <Tooltip title={Tr(T.Apps)}>
                <MarketplaceIcon
                  data-cy="acl-card-icon-MARKETPLACEAPP"
                  className={aclClasses.aclApplies}
                />
              </Tooltip>
            )}
            {resources.includes('VMGROUP') && (
              <Tooltip title={Tr(T.VMGroups)}>
                <VmGroupIcon
                  data-cy="acl-card-icon-VMGROUP"
                  className={aclClasses.aclApplies}
                />
              </Tooltip>
            )}
            {resources.includes('VNTEMPLATE') && (
              <Tooltip title={Tr(T.NetworkTemplates)}>
                <TemplateIcon
                  data-cy="acl-card-icon-VNTEMPLATE"
                  className={aclClasses.aclApplies}
                />
              </Tooltip>
            )}
            {resources.includes('BACKUPJOB') && (
              <Tooltip title={Tr(T.BackupJob)}>
                <BackupJobsIcon
                  data-cy="acl-card-icon-BACKUPJOB"
                  className={aclClasses.aclApplies}
                />
              </Tooltip>
            )}
          </Typography>
        </div>
        <div className={classes.caption}>
          <span data-cy="acl-card-id">{`#${ID}`}</span>

          {idResourceType === ACL_USERS.INDIVIDUAL.type && (
            <Tooltip
              title={Tr([
                T['acls.table.card.resources.individual.tooltip'],
                idResourceId,
              ])}
            >
              <span>
                <span data-cy="acl-card-resourcesIdentifier">
                  {Tr(T.Identifier)} #{idResourceId}
                </span>
              </span>
            </Tooltip>
          )}
          {idResourceType === ACL_USERS.GROUP.type && (
            <Tooltip
              title={Tr([
                T['acls.table.card.resources.group.tooltip'],
                idResourceName,
              ])}
            >
              <span>
                <GroupIcon />
                <span data-cy="acl-card-resourcesIdentifier">
                  {idResourceName}
                </span>
              </span>
            </Tooltip>
          )}
          {idResourceType === ACL_USERS.CLUSTER.type && (
            <Tooltip
              title={Tr([
                T['acls.table.card.resources.cluster.tooltip'],
                idResourceName,
              ])}
            >
              <span>
                <ClusterIcon />
                <span data-cy="acl-card-resourcesIdentifier">
                  {idResourceName}
                </span>
              </span>
            </Tooltip>
          )}
          {idResourceType === ACL_USERS.ALL.type && (
            <Tooltip title={Tr([T['acls.table.card.resources.all.tooltip']])}>
              <span>
                <AllIcon />
                <span data-cy="acl-card-resourcesIdentifier">{Tr(T.All)}</span>
              </span>
            </Tooltip>
          )}
        </div>
      </div>
      <div className={aclClasses.contentWrapper}>
        <div className={classes.caption}>
          {idUserType === ACL_USERS.INDIVIDUAL.type && (
            <Tooltip
              title={Tr([T['acls.table.card.rule.user.tooltip'], idUserName])}
            >
              <span>
                <UserIcon />
                <span data-cy="acl-card-user">{idUserName}</span>
              </span>
            </Tooltip>
          )}
          {idUserType === ACL_USERS.GROUP.type && (
            <Tooltip
              title={Tr([T['acls.table.card.rule.group.tooltip'], idUserName])}
            >
              <span>
                <GroupIcon />
                <span data-cy="acl-card-user">{idUserName}</span>
              </span>
            </Tooltip>
          )}
          {idUserType === ACL_USERS.ALL.type && (
            <Tooltip title={Tr([T['acls.table.card.rule.all.tooltip']])}>
              <span>
                <AllIcon />
                <span data-cy="acl-card-user">{Tr(T.All)}</span>
              </span>
            </Tooltip>
          )}
        </div>
        <div className={classes.caption}>
          {zoneType === ACL_USERS.INDIVIDUAL.type && (
            <Tooltip
              title={Tr([T['acls.table.card.rule.zone.tooltip'], zoneName])}
            >
              <span>
                <ZoneIcon />
                <span data-cy="acl-card-zone">{zoneName}</span>
              </span>
            </Tooltip>
          )}
          {zoneType === ACL_USERS.ALL.type && (
            <Tooltip title={Tr([T['acls.table.card.rule.zone.tooltip.all']])}>
              <span>
                <ZoneIcon />
                <span data-cy="acl-card-zone">{Tr(T.All)}</span>
              </span>
            </Tooltip>
          )}
        </div>
        <div className={classes.caption} data-cy="acl-card-rights">
          <span
            data-cy="acl-card-rights-USE"
            className={
              rights.includes('USE')
                ? aclClasses.rigthApplies
                : aclClasses.rigthNotApplies
            }
          >
            {Tr(T.Use)}
          </span>
          <span
            data-cy="acl-card-rights-MANAGE"
            className={
              rights.includes('MANAGE')
                ? aclClasses.rigthApplies
                : aclClasses.rigthNotApplies
            }
          >
            {Tr(T.Manage)}
          </span>
          <span
            data-cy="acl-card-rights-ADMIN"
            className={
              rights.includes('ADMIN')
                ? aclClasses.rigthApplies
                : aclClasses.rigthNotApplies
            }
          >
            {Tr(T.Admin)}
          </span>
          <span
            data-cy="acl-card-rights-CREATE"
            className={
              rights.includes('CREATE')
                ? aclClasses.rigthApplies
                : aclClasses.rigthNotApplies
            }
          >
            {Tr(T.Create)}
          </span>
        </div>
      </div>
    </div>
  )
}

ACLCardIcon.propTypes = {
  acl: PropTypes.shape({
    ID: PropTypes.string.isRequired,
    idUserName: PropTypes.string,
    idUserType: PropTypes.string.isRequired,
    resources: PropTypes.array.isRequired,
    idResourceId: PropTypes.string,
    idResourceName: PropTypes.string,
    idResourceType: PropTypes.string.isRequired,
    rights: PropTypes.array.isRequired,
    zoneName: PropTypes.string,
    zoneType: PropTypes.string.isRequired,
  }).isRequired,
  rootProps: PropTypes.shape({
    className: PropTypes.string,
  }),
}

ACLCardIcon.displayName = 'ACLCardIcon'

export default ACLCardIcon
