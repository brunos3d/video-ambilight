import { defineConfig } from 'tsup'
import { libraryConfig } from '../../tools/tsup/base'

export default defineConfig(libraryConfig({ useClient: true }))
