import { manifest } from '@vltpkg/package-info'
import { Spec } from '@vltpkg/spec'

const lodash = Spec.parse('lodash@latest')
console.log(lodash)

const mani = await manifest('lodash@latest')
console.log(mani)
