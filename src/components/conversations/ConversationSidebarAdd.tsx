import { onMount } from 'solid-js'
import { useI18n } from '@/hooks'
import { addConversation } from '@/stores/conversation'
import Button from '../ui/Button'

onMount(() => {
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.code === 'KeyT') addConversation()
  })
})

export default () => {
  const { t } = useI18n()
  const handleAdd = () => {
    addConversation()
  }

  return (
    <Button
      icon="i-carbon-add"
      onClick={handleAdd}
      size="sm"
    >
      {t('conversations.add')}
    </Button>
  )
}
