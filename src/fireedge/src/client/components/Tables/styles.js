import { makeStyles } from '@material-ui/core'

export const rowStyles = makeStyles(
  ({ palette, typography, breakpoints, shadows }) => ({
    root: {
      padding: '0.8em',
      color: palette.text.primary,
      backgroundColor: palette.background.paper,
      fontWeight: typography.fontWeightMedium,
      fontSize: '1em',
      borderRadius: 6,
      display: 'flex',
      gap: 8,
      boxShadow: shadows[1],
      [breakpoints.down('md')]: {
        flexWrap: 'wrap'
      }
    },
    main: {
      flex: 'auto',
      overflow: 'hidden'
    },
    title: {
      color: palette.text.primary,
      display: 'flex',
      gap: 6,
      alignItems: 'center',
      flexWrap: 'wrap',
      marginBottom: 8
    },
    labels: {
      display: 'inline-flex',
      gap: 6
    },
    caption: {
      ...typography.caption,
      color: palette.text.secondary,
      marginTop: 4,
      display: 'flex',
      gap: 8,
      wordWrap: 'break-word'
    },
    secondary: {
      width: '25%',
      flexShrink: 0,
      whiteSpace: 'nowrap',
      textAlign: 'right',
      [breakpoints.down('sm')]: {
        display: 'none'
      },
      '& > *': {
        flexShrink: 0,
        whiteSpace: 'nowrap'
      }
    },
    actions: {
      flexShrink: 0
    }
  })

)
