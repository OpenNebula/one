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

const { defaults, httpCodes } = require('server/utils/constants')
const { httpResponse } = require('server/utils/server')
const { Actions: vdcActions } = require('server/utils/constants/commands/vdc')

const { ok, badRequest } = httpCodes
const { defaultEmptyFunction } = defaults

const {
  VDC_ALLOCATE,
  VDC_ADDHOST,
  VDC_ADDCLUSTER,
  VDC_ADDGROUP,
  VDC_ADDDATASTORE,
  VDC_ADDVNET,
  VDC_UPDATE,
  VDC_INFO,
  VDC_DELGROUP,
  VDC_DELCLUSTER,
  VDC_DELDATASTORE,
  VDC_DELHOST,
  VDC_DELVNET,
} = vdcActions

const resourcesForDelete = (xmlData, externalData, xmlKey, externalKey) => {
  const resourceVDC = xmlData
    ? Array.isArray(xmlData)
      ? xmlData
      : [xmlData]
    : []

  return resourceVDC.filter((item) => {
    const { ZONE_ID } = item
    const found = externalData.find(
      (resource) =>
        resource.zone_id === ZONE_ID &&
        resource[externalKey].includes(item[xmlKey])
    )

    return !found
  })
}

const resourcesForAdd = (xmlData, externalData, xmlKey, externalKey) => {
  const resourceVDC = xmlData
    ? Array.isArray(xmlData)
      ? xmlData
      : [xmlData]
    : []

  return externalData.map((obj) => {
    const { zone_id: zoneId } = obj
    const newItems = obj[externalKey].filter((val) => {
      const exist = resourceVDC.some(
        (item) => item.ZONE_ID === zoneId && item[xmlKey] === val
      )

      return !exist
    })

    return { zone_id: zoneId, [externalKey]: newItems }
  })
}

const limitResourceAdd = (data, key) =>
  data.reduce((suma, obj) => suma + (obj?.[key]?.length || 0), 0)

const groupsForVDC = (externalData, xmlData, del = true) => {
  const arrayXmlData = xmlData
    ? Array.isArray(xmlData)
      ? xmlData
      : [xmlData]
    : []

  return del
    ? arrayXmlData.filter((value) => !externalData.includes(value))
    : externalData.filter((value) => !arrayXmlData.includes(value))
}

/**
 * Create VDC.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {string} params.hosts - vdc hosts
 * @param {string} params.datastores - vdc datastores
 * @param {string} params.vnets - vdc vnets
 * @param {string} params.groups - vdc groups
 * @param {string} params.clusters - vdc clusterts
 * @param {string} params.template - vdc template
 * @param {object} userData - user of http request
 * @param {Function} xmlrpc - XML-RPC function
 */
const createVdc = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {},
  xmlrpc = defaultEmptyFunction
) => {
  const { user, password } = userData
  const { hosts, datastores, vnets, groups, clusters, template } = params

  const clustersArray = clusters || []
  const hostsArray = hosts || []
  const datastoresArray = datastores || []
  const vnetsArray = vnets || []
  const groupsArray = groups || []

  const oneClient = xmlrpc(user, password)

  oneClient({
    action: VDC_ALLOCATE,
    parameters: [template],
    callback: (vdcInfoErr, vdcId) => {
      if (vdcInfoErr || Number.isNaN(Number(vdcId))) {
        res.locals.httpCode = httpResponse(badRequest, vdcInfoErr)
        next()

        return
      }

      const vdcErrors = {
        hosts: [],
        datastores: [],
        vnets: [],
        clusters: [],
        groups: [],
      }

      // Send Cluster to VDC
      // Cluster format should be [ { zone_id: 0, cluster_id: 0 } ]
      clustersArray.forEach(
        ({ zone_id: zoneId, cluster_id: internalClusters }) => {
          internalClusters.forEach((clusterId) => {
            oneClient({
              action: VDC_ADDCLUSTER,
              parameters: [
                parseInt(vdcId, 10),
                parseInt(zoneId, 10),
                parseInt(clusterId, 10),
              ],
              callback: (err, id) => {
                if (err || !id) {
                  vdcErrors.clusters.push(err)
                }
              },
            })
          })
        }
      )

      // Send hosts to VDC
      // Host format should be [ { zone_id: 0, host_id: 0 } ]
      hostsArray.forEach(({ zone_id: zoneId, host_id: internalHosts }) => {
        internalHosts.forEach((hostId) => {
          oneClient({
            action: VDC_ADDHOST,
            parameters: [
              parseInt(vdcId, 10),
              parseInt(zoneId, 10),
              parseInt(hostId, 10),
            ],
            callback: (err, id) => {
              if (err || !id) {
                vdcErrors.hosts.push(err)
              }
            },
          })
        })
      })

      // Send datastores to VDC
      // Datastore format should be [ { zone_id: 0, ds_id: 0 } ]
      datastoresArray.forEach(
        ({ zone_id: zoneId, ds_id: internalDatastores }) => {
          internalDatastores.forEach((dsId) => {
            oneClient({
              action: VDC_ADDDATASTORE,
              parameters: [
                parseInt(vdcId, 10),
                parseInt(zoneId, 10),
                parseInt(dsId, 10),
              ],
              callback: (err, id) => {
                if (err || !id) {
                  vdcErrors.datastores.push(err)
                }
              },
            })
          })
        }
      )

      // Send Virtual Networks to VDC
      // VNet format should be [ { zone_id: 0, vnet_id: 0 } ]
      vnetsArray.forEach(({ zone_id: zoneId, vnet_id: internalDatastores }) => {
        internalDatastores.forEach((vnetId) => {
          oneClient({
            action: VDC_ADDVNET,
            parameters: [
              parseInt(vdcId, 10),
              parseInt(zoneId, 10),
              parseInt(vnetId, 10),
            ],
            callback: (err, id) => {
              if (err || !id) {
                vdcErrors.vnets.push(err)
              }
            },
          })
        })
      })

      // Send Groups to VDC
      groupsArray.forEach((groupId) => {
        oneClient({
          action: VDC_ADDGROUP,
          parameters: [parseInt(vdcId, 10), parseInt(groupId, 10)],
          callback: (err, id) => {
            if (err || !id) {
              vdcErrors.groups.push(err)
            }
          },
        })
      })

      // check if any of the errors is not empty
      const hasErrors = Object.values(vdcErrors).some(
        (errorArray) => errorArray.length > 0
      )

      if (hasErrors) {
        let errorMessage = ''
        Object.entries(vdcErrors).forEach(([resource, errors]) => {
          if (errors.length > 0) {
            errorMessage += `${resource}: ${errors.join(', ')}\n`
          }
        })

        res.locals.httpCode = httpResponse(ok, errorMessage)
        next()

        return
      }

      res.locals.httpCode = httpResponse(ok, vdcId)
      next()
    },
  })
}

/**
 * Update VDC.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {string} params.id - vdc ID
 * @param {string} params.hosts - vdc hosts
 * @param {string} params.datastores - vdc datastores
 * @param {string} params.vnets - vdc vnets
 * @param {string} params.groups - vdc groups
 * @param {string} params.clusters - vdc clusterts
 * @param {string} params.template - vdc template
 * @param {object} userData - user of http request
 * @param {Function} xmlrpc - XML-RPC function
 */
const updateVdc = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {},
  xmlrpc = defaultEmptyFunction
) => {
  const { user, password } = userData
  const { hosts, datastores, vnets, groups, clusters, template, id } = params

  if (!id) {
    res.locals.httpCode = httpResponse(badRequest)
    next()

    return
  }

  const vdcID = parseInt(id, 10)
  const oneClient = xmlrpc(user, password)

  const clustersArray = clusters || []
  const datastoresArray = datastores || []
  const hostsArray = hosts || []
  const vnetsArray = vnets || []
  const groupsArray = groups || []

  const vdcErrors = {
    clusters: { add: [], del: [] },
    datastores: { add: [], del: [] },
    hosts: { add: [], del: [] },
    vnets: { add: [], del: [] },
    groups: { add: [], del: [] },
  }

  const results = {
    groups: { add: 0, delete: 0 },
    clusters: { add: 0, delete: 0 },
    datastores: { add: 0, delete: 0 },
    hosts: { add: 0, delete: 0 },
    vnets: { add: 0, delete: 0 },
  }

  const callbackRequest = ({
    groups: groupsProcessed,
    clusters: clustersProcessed,
    datastores: datastoresProcessed,
    hosts: hostsProcessed,
    vnets: vnetsProcessed,
  }) => {
    if (
      groupsProcessed.add.limit === groupsProcessed.add.process &&
      clustersProcessed.add.limit === clustersProcessed.add.process &&
      datastoresProcessed.add.limit === datastoresProcessed.add.process &&
      hostsProcessed.add.limit === hostsProcessed.add.process &&
      vnetsProcessed.add.limit === vnetsProcessed.add.process &&
      groupsProcessed.delete.limit === groupsProcessed.delete.process &&
      clustersProcessed.delete.limit === clustersProcessed.delete.process &&
      datastoresProcessed.delete.limit === datastoresProcessed.delete.process &&
      hostsProcessed.delete.limit === hostsProcessed.delete.process &&
      vnetsProcessed.delete.limit === vnetsProcessed.delete.process
    ) {
      const hasAddErrors = Object.values(vdcErrors).some(
        (errorArray) => errorArray.add.length > 0
      )
      const hasDelErrors = Object.values(vdcErrors).some(
        (errorArray) => errorArray.del.length > 0
      )

      if (hasAddErrors || hasDelErrors) {
        let errorMessage = ''
        Object.entries(vdcErrors).forEach(([resource, errors]) => {
          if (errors.add.length > 0) {
            errorMessage += `add ${resource}: ${errors.join(', ')}\n`
          }
        })
        Object.entries(vdcErrors).forEach(([resource, errors]) => {
          if (errors.del.length > 0) {
            errorMessage += `delete ${resource}: ${errors.join(', ')}\n`
          }
        })
        res.locals.httpCode = httpResponse(ok, errorMessage)
        next()

        return
      }
      res.locals.httpCode = httpResponse(ok, id)
      next()
    }
  }

  const callbackInfo = (vdcInfo) => {
    const groupsForDelete = groupsForVDC(groupsArray, vdcInfo?.GROUPS?.ID)
    const groupsForAdd = groupsForVDC(groupsArray, vdcInfo?.GROUPS?.ID, false)
    const clustersForDelete = resourcesForDelete(
      vdcInfo?.CLUSTERS?.CLUSTER,
      clustersArray,
      'CLUSTER_ID',
      'cluster_id'
    )
    const clustersForAdd = resourcesForAdd(
      vdcInfo?.CLUSTERS?.CLUSTER,
      clustersArray,
      'CLUSTER_ID',
      'cluster_id'
    )
    const datastoresForDelete = resourcesForDelete(
      vdcInfo?.DATASTORES?.DATASTORE,
      datastoresArray,
      'DATASTORE_ID',
      'ds_id'
    )
    const datastoresForAdd = resourcesForAdd(
      vdcInfo?.DATASTORES?.DATASTORE,
      datastoresArray,
      'DATASTORE_ID',
      'ds_id'
    )
    const hostsForDelete = resourcesForDelete(
      vdcInfo?.HOSTS?.HOST,
      hostsArray,
      'HOST_ID',
      'host_id'
    )
    const hostsForAdd = resourcesForAdd(
      vdcInfo?.HOSTS?.HOST,
      hostsArray,
      'HOST_ID',
      'host_id'
    )

    const vnetsForDelete = resourcesForDelete(
      vdcInfo?.VNETS?.VNET,
      vnetsArray,
      'VNET_ID',
      'vnet_id'
    )

    const vnetsForAdd = resourcesForAdd(
      vdcInfo?.VNETS?.VNET,
      vnetsArray,
      'VNET_ID',
      'vnet_id'
    )

    const generateResult = () => {
      callbackRequest({
        groups: {
          add: {
            limit: groupsForAdd.length,
            process: results.groups.add,
          },
          delete: {
            limit: groupsForDelete.length,
            process: results.groups.delete,
          },
        },
        clusters: {
          add: {
            limit: limitResourceAdd(clustersForAdd, 'cluster_id'),
            process: results.clusters.add,
          },
          delete: {
            limit: clustersForDelete.length,
            process: results.clusters.delete,
          },
        },
        datastores: {
          add: {
            limit: limitResourceAdd(datastoresForAdd, 'ds_id'),
            process: results.datastores.add,
          },
          delete: {
            limit: datastoresForDelete.length,
            process: results.datastores.delete,
          },
        },
        hosts: {
          add: {
            limit: limitResourceAdd(hostsForAdd, 'host_id'),
            process: results.hosts.add,
          },
          delete: {
            limit: hostsForDelete.length,
            process: results.hosts.delete,
          },
        },
        vnets: {
          add: {
            limit: limitResourceAdd(vnetsForAdd, 'vnet_id'),
            process: results.vnets.add,
          },
          delete: {
            limit: vnetsForDelete.length,
            process: results.vnets.delete,
          },
        },
      })
    }

    /** Delete resources from VDC */
    // GROUPS
    groupsForDelete.forEach((idGroup) => {
      const group = parseInt(idGroup, 10)
      if (!Number.isNaN(Number(group))) {
        oneClient({
          action: VDC_DELGROUP,
          parameters: [vdcID, group],
          callback: (err, idDeletedGroup) => {
            results.groups.delete = results.groups.delete + 1
            if (err || Number.isNaN(Number(idDeletedGroup))) {
              vdcErrors.groups.del.push(err)
            }
            generateResult()
          },
        })
      }
    })

    // CLUSTERS
    clustersForDelete.forEach((resource) => {
      const zone = parseInt(resource?.ZONE_ID, 10)
      const cluster = parseInt(resource?.CLUSTER_ID, 10)
      if (!Number.isNaN(Number(zone)) && !Number.isNaN(Number(cluster))) {
        oneClient({
          action: VDC_DELCLUSTER,
          parameters: [vdcID, zone, cluster],
          callback: (err, idDeletedClusters) => {
            results.clusters.delete = results.clusters.delete + 1
            if (err || Number.isNaN(Number(idDeletedClusters))) {
              vdcErrors.clusters.del.push(err)
            }
            generateResult()
          },
        })
      }
    })

    // DATASTORES
    datastoresForDelete.forEach((resource) => {
      const zone = parseInt(resource?.ZONE_ID, 10)
      const ds = parseInt(resource?.DATASTORE_ID, 10)
      if (!Number.isNaN(Number(zone)) && !Number.isNaN(Number(ds))) {
        oneClient({
          action: VDC_DELDATASTORE,
          parameters: [vdcID, zone, ds],
          callback: (err, idDeletedDS) => {
            results.datastores.delete = results.datastores.delete + 1
            if (err || Number.isNaN(Number(idDeletedDS))) {
              vdcErrors.datastores.del.push(err)
            }
            generateResult()
          },
        })
      }
    })

    // HOSTS
    hostsForDelete.forEach((resource) => {
      const zone = parseInt(resource?.ZONE_ID, 10)
      const host = parseInt(resource?.HOST_ID, 10)
      if (!Number.isNaN(Number(zone)) && !Number.isNaN(Number(host))) {
        oneClient({
          action: VDC_DELHOST,
          parameters: [vdcID, zone, host],
          callback: (err, idDeletedHosts) => {
            results.hosts.delete = results.hosts.delete + 1
            if (err || Number.isNaN(Number(idDeletedHosts))) {
              vdcErrors.hosts.del.push(err)
            }
            generateResult()
          },
        })
      }
    })

    // VNETS
    vnetsForDelete.forEach((resource) => {
      const zone = parseInt(resource?.ZONE_ID, 10)
      const vnet = parseInt(resource?.VNET_ID, 10)
      if (!Number.isNaN(Number(zone)) && !Number.isNaN(Number(vnet))) {
        oneClient({
          action: VDC_DELVNET,
          parameters: [vdcID, zone, vnet],
          callback: (err, idDeletedVnets) => {
            results.vnets.delete = results.vnets.delete + 1
            if (err || Number.isNaN(Number(idDeletedVnets))) {
              vdcErrors.vnets.del.push(err)
            }
            generateResult()
          },
        })
      }
    })

    /** Add resources from VDC */
    // GROUPS
    groupsForAdd.forEach((groupId) => {
      oneClient({
        action: VDC_ADDGROUP,
        parameters: [vdcID, parseInt(groupId, 10)],
        callback: (err, idGroup) => {
          results.groups.add = results.groups.add + 1
          if (err || Number.isNaN(Number(idGroup))) {
            vdcErrors.groups.add.push(err)
          }
          generateResult()
        },
      })
    })

    // CLUSTERS
    clustersForAdd.forEach(
      ({ zone_id: zoneId, cluster_id: internalClusters }) => {
        internalClusters.forEach((clusterId) => {
          oneClient({
            action: VDC_ADDCLUSTER,
            parameters: [vdcID, parseInt(zoneId, 10), parseInt(clusterId, 10)],
            callback: (err, idCluster) => {
              results.clusters.add = results.clusters.add + 1
              if (err || Number.isNaN(Number(idCluster))) {
                vdcErrors.clusters.add.push(err)
              }
              generateResult()
            },
          })
        })
      }
    )

    // DATASTORES
    datastoresForAdd.forEach(
      ({ zone_id: zoneId, ds_id: internalDatastores }) => {
        internalDatastores.forEach((dsId) => {
          oneClient({
            action: VDC_ADDDATASTORE,
            parameters: [vdcID, parseInt(zoneId, 10), parseInt(dsId, 10)],
            callback: (err, idDs) => {
              results.datastores.add = results.datastores.add + 1
              if (err || Number.isNaN(Number(idDs))) {
                vdcErrors.datastores.add.push(err)
              }
              generateResult()
            },
          })
        })
      }
    )

    // HOSTS
    hostsForAdd.forEach(({ zone_id: zoneId, host_id: internalHosts }) => {
      internalHosts.forEach((hostId) => {
        oneClient({
          action: VDC_ADDHOST,
          parameters: [vdcID, parseInt(zoneId, 10), parseInt(hostId, 10)],
          callback: (err, idHost) => {
            results.hosts.add = results.hosts.add + 1
            if (err || Number.isNaN(Number(idHost))) {
              vdcErrors.hosts.add.push(err)
            }
            generateResult()
          },
        })
      })
    })

    // VNETS
    vnetsForAdd.forEach(({ zone_id: zoneId, vnet_id: internalDatastores }) => {
      internalDatastores.forEach((vnetId, index) => {
        oneClient({
          action: VDC_ADDVNET,
          parameters: [vdcID, parseInt(zoneId, 10), parseInt(vnetId, 10)],
          callback: (err, idVnet) => {
            results.vnets.add = results.vnets.add + 1
            if (err || Number.isNaN(Number(idVnet))) {
              vdcErrors.vnets.add.push(err)
            }
            generateResult()
          },
        })
      })
    })
    generateResult()
  }

  oneClient({
    action: VDC_UPDATE,
    parameters: [vdcID, template],
    callback: (vdcInfoErr, vdcId) => {
      if (vdcInfoErr || Number.isNaN(Number(vdcId))) {
        res.locals.httpCode = httpResponse(badRequest, vdcInfoErr)
        next()

        return
      }

      oneClient({
        action: VDC_INFO,
        parameters: [vdcID],
        callback: (err, vdcInfo) => {
          if (err || !vdcInfo?.VDC) {
            res.locals.httpCode = httpResponse(badRequest, err)
            next()

            return
          }

          callbackInfo(vdcInfo?.VDC)
        },
      })
    },
  })
}

module.exports = {
  createVdc,
  updateVdc,
}
