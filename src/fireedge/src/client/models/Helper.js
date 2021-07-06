import { DateTime } from 'luxon'

export const booleanToString = bool => bool ? 'Yes' : 'No'

export const stringToBoolean = str =>
  String(str).toLowerCase() === 'yes' || +str === 1

export const timeToString = time =>
  +time ? new Date(+time * 1000).toLocaleString() : '-'

export const timeFromMilliseconds = time =>
  DateTime.fromMillis(+time * 1000)

export const levelLockToString = level => ({
  0: 'None',
  1: 'Use',
  2: 'Manage',
  3: 'Admin',
  4: 'All'
}[level] || '-')

export const permissionsToOctal = permissions => {
  const {
    OWNER_U, OWNER_M, OWNER_A,
    GROUP_U, GROUP_M, GROUP_A,
    OTHER_U, OTHER_M, OTHER_A
  } = permissions

  const getCategoryValue = ([u, m, a]) => (
    (stringToBoolean(u) ? 4 : 0) +
    (stringToBoolean(m) ? 2 : 0) +
    (stringToBoolean(a) ? 1 : 0)
  )

  return [
    [OWNER_U, OWNER_M, OWNER_A],
    [GROUP_U, GROUP_M, GROUP_A],
    [OTHER_U, OTHER_M, OTHER_A]
  ].map(getCategoryValue).join('')
}
