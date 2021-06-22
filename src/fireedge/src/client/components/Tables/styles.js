import { makeStyles } from '@material-ui/core'

export const rowStyles = makeStyles(
  ({ palette, typography, breakpoints }) => ({
    main: {
      flex: 'auto'
    },
    title: {
      color: palette.text.primary,
      display: 'flex',
      alignItems: 'center'
    },
    labels: {
      display: 'inline-flex',
      gap: 6,
      marginLeft: 6
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
    }
  })
)
