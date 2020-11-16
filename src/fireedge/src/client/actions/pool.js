const START_ONE_REQUEST = 'START_ONE_REQUEST'
const SUCCESS_ONE_REQUEST = 'SUCCESS_ONE_REQUEST'
const FAILURE_ONE_REQUEST = 'FAILURE_ONE_REQUEST'

const Actions = {
  START_ONE_REQUEST,
  SUCCESS_ONE_REQUEST,
  FAILURE_ONE_REQUEST
}

module.exports = {
  Actions,
  setVms: vms => ({
    type: SUCCESS_ONE_REQUEST,
    payload: { vms }
  }),
  setTemplates: templates => ({
    type: SUCCESS_ONE_REQUEST,
    payload: { templates }
  }),
  setApplications: applications => ({
    type: SUCCESS_ONE_REQUEST,
    payload: { applications }
  }),
  setApplicationsTemplates: applicationsTemplates => ({
    type: SUCCESS_ONE_REQUEST,
    payload: { applicationsTemplates }
  }),
  setDatastores: datastores => ({
    type: SUCCESS_ONE_REQUEST,
    payload: { datastores }
  }),
  setVRouters: virtualRouters => ({
    type: SUCCESS_ONE_REQUEST,
    payload: { virtualRouters }
  }),
  setVmGroups: vmGroups => ({
    type: SUCCESS_ONE_REQUEST,
    payload: { vmGroups }
  }),
  setImages: images => ({
    type: SUCCESS_ONE_REQUEST,
    payload: { images }
  }),
  setFiles: files => ({
    type: SUCCESS_ONE_REQUEST,
    payload: { files }
  }),
  setMarketplaces: marketplaces => ({
    type: SUCCESS_ONE_REQUEST,
    payload: { marketplaces }
  }),
  setApps: apps => ({
    type: SUCCESS_ONE_REQUEST,
    payload: { apps }
  }),
  setVNetworks: vNetworks => ({
    type: SUCCESS_ONE_REQUEST,
    payload: { vNetworks }
  }),
  setVNetworksTemplates: vNetworksTemplates => ({
    type: SUCCESS_ONE_REQUEST,
    payload: { vNetworksTemplates }
  }),
  setSecGroups: securityGroups => ({
    type: SUCCESS_ONE_REQUEST,
    payload: { securityGroups }
  }),
  setCluster: clusters => ({
    type: SUCCESS_ONE_REQUEST,
    payload: { clusters }
  }),
  setHosts: hosts => ({
    type: SUCCESS_ONE_REQUEST,
    payload: { hosts }
  }),
  setZones: zones => ({
    type: SUCCESS_ONE_REQUEST,
    payload: { zones }
  }),
  setUsers: users => ({
    type: SUCCESS_ONE_REQUEST,
    payload: { users }
  }),
  setGroups: groups => ({
    type: SUCCESS_ONE_REQUEST,
    payload: { groups }
  }),
  setVdc: vdc => ({
    type: SUCCESS_ONE_REQUEST,
    payload: { vdc }
  }),
  setAcl: acl => ({
    type: SUCCESS_ONE_REQUEST,
    payload: { acl }
  }),
  setProvidersTemplates: providersTemplates => ({
    type: SUCCESS_ONE_REQUEST,
    payload: { providersTemplates }
  }),
  setProviders: providers => ({
    type: SUCCESS_ONE_REQUEST,
    payload: { providers }
  }),
  setProvisionsTemplates: provisionsTemplates => ({
    type: SUCCESS_ONE_REQUEST,
    payload: { provisionsTemplates }
  }),
  setProvisions: provisions => ({
    type: SUCCESS_ONE_REQUEST,
    payload: { provisions }
  }),
  startOneRequest: () => ({
    type: START_ONE_REQUEST
  }),
  failureOneRequest: error => ({
    type: FAILURE_ONE_REQUEST,
    payload: { error }
  })
}
