import { createStores, rebuildStores } from '@/stores/storage/db'

const buildStores = async() => {
  createStores()
  await rebuildStores()
}

export default () => {
  buildStores()
  return null
}
