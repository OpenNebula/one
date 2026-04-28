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

// Driver
const { Actions, Commands } = require('server/routes/api/oneks/routes')

const {
  clusters,
  clustersFamilies,
  nodegroupFamilies,
  cluster,
  clusterFamily,
  create,
  clusterDelete,
  clusterKubeconfig,
  clusterEndpoint,
  createNodeGroup,
  updateNodeGroup,
  deleteNodeGroup,
  scaleNodeGroup,
  oneksLogs,
  recover,
  recoverNodeGroup,
  oneksChmod,
  oneksChown,
  oneksChgrp,
  updateDocumentOneKs,
  upgradeKubernetesVersion,
} = require('server/routes/api/oneks/functions')

// Routes definition
const endpoints = [
  {
    action: clusters,
    ...Commands[Actions.LIST],
  },
  {
    action: clustersFamilies,
    ...Commands[Actions.LIST_FAMILIES],
  },
  {
    action: nodegroupFamilies,
    ...Commands[Actions.LIST_NODEGROUP_FAMILIES],
  },
  {
    action: clusterFamily,
    ...Commands[Actions.SHOW_FAMILY],
  },
  {
    action: clusterKubeconfig,
    ...Commands[Actions.KUBECONFIG],
  },
  {
    action: clusterEndpoint,
    ...Commands[Actions.ENDPOINT],
  },
  {
    action: cluster,
    ...Commands[Actions.SHOW],
  },
  {
    action: create,
    ...Commands[Actions.CREATE],
  },
  {
    action: clusterDelete,
    ...Commands[Actions.DELETE],
  },
  {
    action: createNodeGroup,
    ...Commands[Actions.CREATE_NODEGROUP],
  },
  {
    action: updateNodeGroup,
    ...Commands[Actions.UPDATE_NODEGROUP],
  },
  {
    action: deleteNodeGroup,
    ...Commands[Actions.DELETE_NODEGROUP],
  },
  {
    action: scaleNodeGroup,
    ...Commands[Actions.SCALE_NODEGROUP],
  },
  {
    action: oneksLogs,
    ...Commands[Actions.LOGS],
  },
  {
    action: recover,
    ...Commands[Actions.RECOVER],
  },
  {
    action: recoverNodeGroup,
    ...Commands[Actions.RECOVER_NODEGROUP],
  },
  {
    action: oneksChmod,
    ...Commands[Actions.CHMOD],
  },
  {
    action: oneksChown,
    ...Commands[Actions.CHOWN],
  },
  {
    action: oneksChgrp,
    ...Commands[Actions.CHGRP],
  },
  {
    action: updateDocumentOneKs,
    ...Commands[Actions.UPDATE_DOCUMENT],
  },
  {
    action: upgradeKubernetesVersion,
    ...Commands[Actions.UPGRADE_KUBERNETES_VERSION],
  },
]

module.exports = [...endpoints]
