export const TYPES_POLICY = [
  { text: 'Change', value: 'CHANGE', min: false },
  { text: 'Cardinality', value: 'CARDINALITY', min: false },
  { text: 'Percentege change', value: 'PERCENTAGE_CHANGE' }
]

export const TIME_FORMATS = [
  { text: 'Recurrence', value: 'recurrence' },
  { text: 'Start time', value: 'start_time', date: true }
]

export const hasMinValue = type => TYPES_POLICY.some(
  ({ value, min }) => value === type && min === false
)

export const isDateFormat = format => TIME_FORMATS.some(
  ({ value, date }) => value === format && date === true
)
