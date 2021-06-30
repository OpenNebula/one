import { makeStyles } from '@material-ui/core'

import { addOpacityToColor } from 'client/utils'

export default makeStyles(({ palette, typography, breakpoints }) => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  toolbar: {
    ...typography.body1,
    marginBottom: 16,
    display: 'flex',
    gap: '1em',
    alignItems: 'start',
    justifyContent: 'space-between',
    '& > div:first-child': {
      flexGrow: 1
    }
  },
  pagination: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'end',
    gap: '1em'
  },
  loading: {
    transition: '200ms'
  },
  table: {
    display: 'grid',
    gridTemplateColumns: 'minmax(auto, 300px) 1fr',
    gap: 8,
    overflow: 'auto',
    [breakpoints.down('sm')]: {
      gridTemplateColumns: 'minmax(0, 1fr)'
    }
  },
  body: {
    overflow: 'auto',
    display: 'grid',
    gap: '1em',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gridAutoRows: 'max-content',
    '& > [role=row]': {
      padding: '0.8em',
      cursor: 'pointer',
      color: palette.text.primary,
      backgroundColor: palette.background.paper,
      fontWeight: typography.fontWeightMedium,
      fontSize: '1em',
      borderRadius: 6,
      display: 'flex',
      gap: 8,
      '&:hover': {
        backgroundColor: palette.action.hover
      },
      '&.selected': {
        backgroundColor: addOpacityToColor(palette.secondary.main, 0.2),
        border: `1px solid ${palette.secondary.main}`
      }
    }
  },
  noDataMessage: {
    ...typography.h6,
    color: palette.text.hint,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '1em'
  }
}))
