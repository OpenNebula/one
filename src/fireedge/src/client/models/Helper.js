import { DateTime } from 'luxon'

export const booleanToString = bool => bool ? 'Yes' : 'No'

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
