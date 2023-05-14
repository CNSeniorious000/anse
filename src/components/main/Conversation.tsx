import { Match, Switch, createEffect } from 'solid-js'
import { useStore } from '@nanostores/solid'
import { conversationMap, currentConversationId } from '@/stores/conversation'
import { conversationMessagesMap } from '@/stores/messages'
import { getBotMetaById } from '@/stores/provider'
import ConversationEmpty from './ConversationEmpty'
import Welcome from './Welcome'
import Continuous from './Continuous'
import Single from './Single'
import Image from './Image'

export default () => {
  const $conversationMap = useStore(conversationMap)
  const $conversationMessagesMap = useStore(conversationMessagesMap)
  const $currentConversationId = useStore(currentConversationId)

  const currentConversation = () => {
    return $conversationMap()[$currentConversationId()]
  }
  const currentBot = () => {
    return getBotMetaById(currentConversation()?.bot)
  }
  const currentConversationMessages = () => {
    return $conversationMessagesMap()[$currentConversationId()] || []
  }

  createEffect(() => { document.title = currentConversation() ? `Anse • ${currentConversation().name || 'New Chat'}` : 'Anse' })

  return (
    <Switch
      fallback={(
        <Welcome />
      )}
    >
      <Match when={$currentConversationId() && !currentConversationMessages().length}>
        <ConversationEmpty conversation={currentConversation()} />
      </Match>
      <Match when={currentBot()?.type === 'chat_continuous'}>
        <Continuous
          conversationId={$currentConversationId()}
          messages={currentConversationMessages}
        />
      </Match>
      <Match when={currentBot()?.type === 'chat_single'}>
        <Single
          conversationId={$currentConversationId()}
          messages={currentConversationMessages}
        />
      </Match>
      <Match when={currentBot()?.type === 'image_generation'}>
        <Image
          // conversationId={$currentConversationId()}
          messages={currentConversationMessages}
          // fetching={isLoading() || !isStreaming()}
        />
      </Match>
    </Switch>
  )
}
