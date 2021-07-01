import { useSelector, shallowEqual } from 'react-redux'

export const useOne = () => (
  useSelector(state => state.one, shallowEqual)
)

export * from 'client/features/One/application/hooks'
export * from 'client/features/One/applicationTemplate/hooks'
export * from 'client/features/One/cluster/hooks'
export * from 'client/features/One/datastore/hooks'
export * from 'client/features/One/group/hooks'
export * from 'client/features/One/host/hooks'
export * from 'client/features/One/image/hooks'
export * from 'client/features/One/marketplace/hooks'
export * from 'client/features/One/marketplaceApp/hooks'
export * from 'client/features/One/provider/hooks'
export * from 'client/features/One/provision/hooks'
export * from 'client/features/One/user/hooks'
export * from 'client/features/One/vm/hooks'
export * from 'client/features/One/vmTemplate/hooks'
export * from 'client/features/One/vnetwork/hooks'
export * from 'client/features/One/vnetworkTemplate/hooks'
export * from 'client/features/One/zone/hooks'
