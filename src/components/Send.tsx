import { Match, Switch, createSignal, onMount } from 'solid-js'
import { useStore } from '@nanostores/solid'
import { createShortcut } from '@solid-primitives/keyboard'
import { currentErrorMessage, isSendBoxFocus, scrollController } from '@/stores/ui'
import { addConversation, conversationMap, currentConversationId } from '@/stores/conversation'
import { loadingStateMap, streamsMap } from '@/stores/streams'
import { handlePrompt } from '@/logics/conversation'
import { globalAbortController } from '@/stores/settings'
import { useI18n } from '@/hooks'
import Button from './ui/Button'

export default () => {
  const { t } = useI18n()
  let inputRef: HTMLTextAreaElement
  const $conversationMap = useStore(conversationMap)
  const $currentConversationId = useStore(currentConversationId)
  const $isSendBoxFocus = useStore(isSendBoxFocus)
  const $currentErrorMessage = useStore(currentErrorMessage)
  const $streamsMap = useStore(streamsMap)
  const $loadingStateMap = useStore(loadingStateMap)
  const $globalAbortController = useStore(globalAbortController)

  const [inputPrompt, setInputPrompt] = createSignal('')
  const isEditing = () => inputPrompt() || $isSendBoxFocus()
  const currentConversation = () => {
    return $conversationMap()[$currentConversationId()]
  }
  const isStreaming = () => !!$streamsMap()[$currentConversationId()]
  const isLoading = () => !!$loadingStateMap()[$currentConversationId()]

  onMount(() => {
    createShortcut(['Control', 'Enter'], () => {
      $isSendBoxFocus() && handleSend()
    })

    addEventListener('keydown', (e) => {
      if (e.code === 'Slash' && stateType() === 'normal') {
        isSendBoxFocus.set(true)
        inputRef.focus()
        e.preventDefault()
      }
    })
  })

  const stateType = () => {
    if ($currentErrorMessage())
      return 'error'
    else if (isLoading() || isStreaming())
      return 'loading'
    else if (isEditing())
      return 'editing'
    else
      return 'normal'
  }

  const EmptyState = () => (
    <div
      class="flex-row h-full max-w-base gap-2 fi"
      onClick={() => {
        isSendBoxFocus.set(true)
        inputRef.focus()
      }}
    >
      <div class="flex-1 text-sm op-30">{t('send.placeholder')}</div>
    </div>
  )

  const EditState = () => (
    <div class="flex flex-col h-full">
      <div class="flex-1 relative">
        <textarea
          ref={inputRef!}
          placeholder={t('send.placeholder')}
          autocomplete="off"
          onBlur={() => { isSendBoxFocus.set(false) }}
          onInput={() => { setInputPrompt(inputRef.value) }}
          onKeyDown={(e) => {
            e.key === 'Enter' && !e.isComposing && !e.shiftKey && handleSend()
          }}
          class="h-full text-sm w-full py-4 px-[calc(max(1.5rem,(100%-48rem)/2))] inset-0 absolute input-base scroll-pa-4"
        />
      </div>
      <div class="border-t border-base h-14 px-[calc(max(1.5rem,(100%-48rem)/2)-0.5rem)] gap-2 fi justify-between">
        <div>
          {/* <Button
            icon="i-carbon-plug"
            onClick={() => {}}
          /> */}
        </div>
        <Button
          icon="i-carbon-send"
          onClick={handleSend}
          variant={inputPrompt() ? 'primary' : 'normal'}
          // prefix={t('send.button')}
        />
      </div>
    </div>
  )

  const ErrorState = () => (
    <div class="flex flex-col h-full max-w-base text-error text-sm py-4 gap-8 items-end justify-between sm:(flex-row items-center) ">
      <div class="flex-1 w-full">
        <div class="mb-1 gap-0.5 fi">
          <span i-carbon-warning />
          <span class="font-semibold">{$currentErrorMessage()?.code}</span>
        </div>
        <div>{$currentErrorMessage()?.message}</div>
      </div>
      <div
        class="border border-error rounded-md py-1 px-2 hv-base hover:bg-white"
        onClick={() => { currentErrorMessage.set(null) }}
      >
        Dismiss
      </div>
    </div>
  )

  const clearPrompt = () => {
    setInputPrompt('')
    isSendBoxFocus.set(false)
  }

  const handleAbortFetch = () => {
    $globalAbortController()?.abort()
    clearPrompt()
  }

  const LoadingState = () => (
    <div class="flex-row h-full max-w-base gap-2 fi">
      <div class="flex-1 op-50">Thinking...</div>
      <div
        class="border rounded-md border-base-100 text-sm py-1 px-2 hv-base op-40 hover:bg-white"
        onClick={() => { handleAbortFetch() }}
      >
        Abort
      </div>
    </div>
  )

  const handleSend = () => {
    if (!inputRef.value)
      return
    if (!currentConversation())
      addConversation()

    const controller = new AbortController()
    globalAbortController.set(controller)
    handlePrompt(currentConversation(), inputRef.value, controller.signal)
    clearPrompt()
    scrollController().scrollToBottom()
  }

  const stateRootClass = () => {
    if (stateType() === 'normal')
      return 'hv-base'
    else if (stateType() === 'error')
      return 'bg-red/8'
    else if (stateType() === 'loading')
      return 'loading-anim bg-base-100'
    else if (stateType() === 'editing')
      return 'bg-base-100'
    return ''
  }

  const stateHeightClass = () => {
    if (stateType() === 'normal')
      return 'px-6 h-14'
    else if (stateType() === 'error')
      return 'px-6'
    else if (stateType() === 'loading')
      return 'px-6 h-14'
    else if (stateType() === 'editing')
      return 'h-54'
    return ''
  }

  return (
    <div class={`sticky bottom-0 left-0 right-0 overflow-hidden shrink-0 border-t border-base pb-[env(safe-area-inset-bottom)] transition transition-colors duration-300  ${stateRootClass()}`}>
      <div class={`relative transition transition-height duration-240 ${stateHeightClass()}`}>
        <Switch fallback={<EmptyState />}>
          <Match when={stateType() === 'error'}>
            <ErrorState />
          </Match>
          <Match when={stateType() === 'loading'}>
            <LoadingState />
          </Match>
          <Match when={stateType() === 'editing'}>
            <EditState />
          </Match>
        </Switch>
      </div>
    </div>
  )
}
