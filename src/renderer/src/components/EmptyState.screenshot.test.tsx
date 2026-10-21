import { visualCase } from '../test/visual'
import EmptyState from './EmptyState'

visualCase('inbox-zero', <EmptyState kind="zero" />)
visualCase('refresh-failed', <EmptyState kind="error" />)
visualCase('partial-inbox', <EmptyState kind="partial" />)
