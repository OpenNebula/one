export const getTotalLeases = ({ AR_POOL } = {}) => {
  const addressRanges = [AR_POOL?.AR ?? []].flat()

  return addressRanges.reduce((total, { SIZE = 0 }) => total + (+SIZE), 0)
}

export const getLeasesInfo = ({ USED_LEASES, ...virtualNetwork } = {}) => {
  const totalLeases = getTotalLeases(virtualNetwork)
  const percentOfUsed = +USED_LEASES * 100 / +totalLeases || 0
  const percentLabel = `${USED_LEASES} / ${totalLeases} (${Math.round(percentOfUsed)}%)`

  return { percentOfUsed, percentLabel }
}
