import { For, Show } from 'solid-js/web'
import { createSignal } from 'solid-js'
import { useStore } from '@nanostores/solid'
import { useClipboardCopy, useI18n } from '@/hooks'
import { deleteMessageByConversationId, getMessagesByConversationId, spliceMessageByConversationId, spliceUpdateMessageByConversationId, updateMessage } from '@/stores/messages'
import { conversationMap, currentConversationId } from '@/stores/conversation'
import { handlePrompt } from '@/logics/conversation'
import { scrollController, showShareModal } from '@/stores/ui'
import { globalAbortController } from '@/stores/settings'
import StreamableText from '../StreamableText'
import { DropDownMenu, Tooltip } from '../ui/base'
import Button from '../ui/Button'
import type { MenuItem } from '../ui/base'
import type { MessageInstance } from '@/types/message'

interface Props {
  conversationId: string
  message: MessageInstance
  index: number
  handleStreaming?: () => void
}

export default (props: Props) => {
  let inputRef: HTMLTextAreaElement

  const { t } = useI18n()
  const $conversationMap = useStore(conversationMap)
  const $currentConversationId = useStore(currentConversationId)

  const [showRawCode, setShowRawCode] = createSignal(false)
  const [copied, setCopied] = createSignal(false)
  const [isEditing, setIsEditing] = createSignal(false)
  const [inputPrompt, setInputPrompt] = createSignal(props.message.content)

  const currentConversation = () => {
    return $conversationMap()[props.conversationId]
  }

  const handleCopyMessageItem = () => {
    const [Iscopied, copy] = useClipboardCopy(props.message.content)
    copy()
    setCopied(Iscopied())
    setTimeout(() => setCopied(false), 1000)
  }

  const handleDeleteMessageItem = () => {
    deleteMessageByConversationId(props.conversationId, props.message)
  }

  const handleRetryMessageItem = () => {
    const controller = new AbortController()
    globalAbortController.set(controller)
    spliceMessageByConversationId(props.conversationId, props.message)
    handlePrompt(currentConversation(), '', controller.signal)
    // TODO: scrollController seems not working
    scrollController().scrollToBottom()
  }

  const handleEditMessageItem = () => {
    setIsEditing(true)
    inputRef.focus()
  }

  const handleShareMessageItem = () => {
    const messages = getMessagesByConversationId($currentConversationId())
    messages.forEach((message) => {
      updateMessage($currentConversationId(), message.id, { isSelected: props.message.id === message.id },
      )
    })
    showShareModal.set(true)
  }

  const handleSend = () => {
    if (!inputRef.value)
      return
    const controller = new AbortController()
    const currentMessage: MessageInstance = {
      ...props.message,
      content: inputPrompt(),
    }

    globalAbortController.set(controller)
    spliceUpdateMessageByConversationId(props.conversationId, currentMessage)
    setIsEditing(false)
    handlePrompt(currentConversation(), '', controller.signal)
    scrollController().scrollToBottom()
  }

  const [menuList, setMenuList] = createSignal<MenuItem[]>([
    { id: 'retry', label: 'Send from here', icon: 'i-carbon-send', role: 'all', action: handleRetryMessageItem },
    { id: 'raw', label: 'Show raw text', icon: 'i-carbon-code', role: 'system', action: () => setShowRawCode(!showRawCode()) },
    { id: 'edit', label: 'Edit', icon: 'i-carbon:edit', role: 'user', action: handleEditMessageItem },
    { id: 'copy', label: 'Copy', icon: 'i-carbon-copy', role: 'all', action: handleCopyMessageItem },
    { id: 'delete', label: 'Delete', icon: 'i-carbon-trash-can', role: 'all', action: handleDeleteMessageItem },
    { id: 'share', label: 'Share message', icon: 'i-carbon:export', role: 'all', action: handleShareMessageItem },
  ])

  if (props.message.role === 'user')
    setMenuList(menuList().filter(item => ['all', 'user'].includes(item.role!)))
  else
    setMenuList(menuList().filter(item => ['all', 'system'].includes(item.role!)))

  const roleClass = {
    system: 'bg-gradient-to-b from-gray-300 via-gray-200 to-gray-300',
    user: 'bg-gradient-to-b from-gray-300/35 to-gray-400/35',
    assistant: 'bg-gradient-to-b from-[#d0b6fa] to-[#947cff]',
  }

  return (
    <div
      class="bg-base p-6 break-words group relative"
      classList={{
        'bg-base-100': props.message.role === 'user',
      }}
    >
      <div class="flex max-w-base gap-4 overflow-hidden">
        <div class={`shrink-0 w-7 h-7 rounded-md op-80 ${roleClass[props.message.role]}`} />
        <div id="menuList-wrapper" class={`sm:hidden block absolute bottom-2 right-4 z-10 cursor-pointer op-0 group-hover-op-70 ${isEditing() && '!hidden'}`}>
          <DropDownMenu menuList={menuList()}>
            <div class="text-xl i-carbon:overflow-menu-horizontal !bg-current" />
          </DropDownMenu>
        </div>
        <div class={`hidden sm:block absolute right-6 -top-4 ${!props.index && 'top-0'} ${isEditing() && '!hidden'}`}>
          <div class="border border-base rounded-md space-x-2 py-1 px-2 transition-opacity fcc op-0 !bg-base group-hover:op-80">
            <For each={menuList()}>
              {item => (
                <Tooltip tip={item.label} handleChildClick={item.action}>
                  {
                    (() => {
                      if (item.id === 'copy') return <div class={`menu-icon ${copied() ? 'i-carbon-checkmark !text-emerald-400' : 'i-carbon-copy'}`} />
                      else if (item.id === 'raw') return <div class={`menu-icon ${showRawCode() ? 'i-carbon-code-hide !text-emerald-400' : 'i-carbon-code'}`} />
                      else return <div class={`${item.icon} menu-icon`} />
                    })()
                  }
                </Tooltip>)}
            </For>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <Show when={isEditing()} >
            <textarea
              ref={inputRef!}
              value={inputPrompt()}
              title="chat"
              autocomplete="off"
              onInput={() => { setInputPrompt(inputRef.value) }}
              onKeyDown={(e) => {
                e.key === 'Enter' && !e.isComposing && !e.shiftKey && handleSend()
              }}
              class="bg-darker rounded-md w-full py-4 px-[calc(max(1.5rem,(100%-48rem)/2))] inset-0 input-base op-70 scroll-pa-4"
            />

            <div class="flex space-x-2 mt-1 justify-end">
              <Button size="sm" onClick={() => setIsEditing(false)}>{t('conversations.confirm.cancel')}</Button>
              <Button size="sm" variant="primary" onClick={() => handleSend()}>{t('conversations.confirm.submit')}</Button>
            </div>
          </Show>
          <Show when={!isEditing()}>
            <StreamableText
              text={props.message.content}
              streamInfo={props.message.stream
                ? () => ({
                    conversationId: props.conversationId,
                    messageId: props.message.id || '',
                    handleStreaming: props.handleStreaming,
                  })
                : undefined}
              showRawCode={showRawCode()}
            />
          </Show>

        </div>

      </div>
    </div>
  )
}
