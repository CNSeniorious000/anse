import { useStore } from '@nanostores/solid'
import { onMount } from 'solid-js'
import { currentConversationId } from '@/stores/conversation'
import {
  scrollController,
  showConfirmModal,
} from '@/stores/ui'
import { clearMessagesByConversationId } from '@/stores/messages'
import { useI18n } from '@/hooks'
import ConfirmModal from '../ui/ConfirmModal'

onMount(() => {
  addEventListener('keydown', (e) => {
    if (e.altKey && e.code === 'KeyC') showConfirmModal.set(true)
  })
})

export default () => {
  const $currentConversationId = useStore(currentConversationId)
  const { t } = useI18n()

  const handleClearMessage = () => {
    clearMessagesByConversationId($currentConversationId())
    scrollController().scrollToBottom()
    showConfirmModal.set(false)
  }

  return (
    <>
      {$currentConversationId() && (
        <div
          class="fcc p-2 rounded-md text-xl hv-foreground"
          onClick={() => { showConfirmModal.set(true) }}
        >
          <div i-carbon-clean />
        </div>
      )}
      <ConfirmModal title={t('conversations.confirm.title')} description={t('conversations.confirm.desc')} onConfirm={handleClearMessage} onCancel={() => { showConfirmModal.set(false) }} />
    </>
  )
}
