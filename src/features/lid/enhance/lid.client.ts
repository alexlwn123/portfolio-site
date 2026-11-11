import { browserEnv } from './env'
import { enhanceLid } from './index'

/*
 * The home page's one script. It adds to a lid that is already whole, so if
 * anything here fails the visitor keeps the static lid and loses nothing.
 */
try {
  enhanceLid(document, browserEnv(window))
} catch {
  // An old or locked-down browser. The lid needs no script to be read and used.
}
