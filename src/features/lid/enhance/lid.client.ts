import { keepStrapLinksInView } from '../../nav/keepInView'
import { browserEnv } from './env'
import { enhanceLid } from './index'

/*
 * The home page's one script. It adds to a page that is already whole, so if
 * anything here fails the visitor keeps the static page and loses nothing.
 */
try {
  enhanceLid(document, browserEnv(window))
} catch {
  // An old or locked-down browser. The lid needs no script to be read and used.
}

try {
  keepStrapLinksInView(document)
} catch {
  // The strap's links are all reachable without this: it only saves a link from sitting half in view.
}
