# Local build dependency: deepmerge-safe

Private, MIT-licensed fork of deepmerge 4.3.1's bundled CommonJS distribution.
This is a MangaList-maintained patch, not an upstream release or advisory waiver.
`provenance.json` records the original registry archive integrity and file hashes;
`LICENSE` preserves the upstream copyright and full MIT license.

The patch rejects `__proto__`, `constructor` and `prototype` in both target and
source copy loops, writes own data properties with `Object.defineProperty`, and
fails closed when a proxy prevents target inspection. Nested merges use the same
guard. These keys are intentionally unsupported even when explicitly owned.
The remaining merge API, arrays, symbols and customization options are preserved.
User callbacks remain trusted executable code, not a security sandbox.

Used only to build PWA assets through Workbox 7 / Rollup node-resolve. The PWA
package explicitly installs this local dependency and overrides `deepmerge` to it.
No npm package is published. `npm ci --prefix src-pwa` must work from the lockfile.

`npm test` includes tests against the dependency actually resolved by Rollup,
including prototype-poisoning inputs and API compatibility. The protected
`npm run audit:dependencies` command runs both npm audits unchanged at severity low.
CI requires both checks. npm cannot audit this private fork against a registry
advisory; zero registry findings alone is insufficient.

Remove the local package and override only after a compatible upstream release
fixes GHSA-gcqx-w48m-w2h4 and passes the same security, clean-install, build and
PWA tests. Maintain this code and its tests until then.
