import { Show, createEffect, createMemo, createSignal } from 'solid-js'
import { useStore } from '@nanostores/solid'
import { conversationMap, currentConversationId } from '@/stores/conversation'
import { useI18n } from '@/hooks'

export default () => {
  const { t } = useI18n()
  const $conversationMap = useStore(conversationMap)
  const $currentConversationId = useStore(currentConversationId)
  const currentConversation = () => {
    return $conversationMap()[$currentConversationId()]
  }

  const [displayName, setDisplayName] = createSignal('')

  const [duringTransition, setDuringTransition] = createSignal(false)

  let oldName = displayName()

  let nameTransitionLoop: NodeJS.Timer | null = null
  let titleTransitionLoop: NodeJS.Timer | null = null

  createEffect(() => {
    const newName = currentConversation() ? (currentConversation().name || t('conversations.untitled')) : ''
    nameTransitionLoop && clearInterval(nameTransitionLoop)
    nameTransitionLoop = setInterval(() => {
      // console.log({ oldName, newName })
      if (oldName !== newName) {
        oldName = newName.startsWith(oldName) ? newName.slice(0, oldName.length + 1) : oldName.slice(0, -1)
        setDisplayName(oldName)
        setDuringTransition(true)
      } else {
        clearInterval(nameTransitionLoop as NodeJS.Timer)
        nameTransitionLoop = null
        setDuringTransition(false)
      }
    }, 1000 / 60)
  })

  createEffect(() => {
    let lastTitle = document.title
    const thisTitle = currentConversation() ? `Anse • ${currentConversation().name || 'New Chat'}` : 'Anse'
    titleTransitionLoop && clearInterval(titleTransitionLoop)
    titleTransitionLoop = setInterval(() => {
      // console.log({ lastTitle, thisTitle })
      if (lastTitle !== thisTitle) {
        thisTitle.startsWith(lastTitle) ? (lastTitle = thisTitle.slice(0, lastTitle.length + 1)) : (lastTitle = lastTitle.slice(0, -1))
        document.title = `${lastTitle} •`
      } else {
        clearInterval(titleTransitionLoop as NodeJS.Timer)
        document.title = lastTitle
      }
    }, 1000 / 30)
  })

  return (
    <div class="fi gap-1 max-w-40vw px-2 overflow-hidden text-sm">
      <Show when={currentConversation()}>
        <Show when={currentConversation().icon}>
          <div class="fcc -ml-2 w-8 h-8 rounded-full text-xl shrink-0 hidden md:flex">{currentConversation().icon}</div>
        </Show>
        <div class="truncate flex flex-row gap-1 items-center">
          {displayName()}
          <div
            i-svg-spinners-8-dots-rotate
            transition-all
            duration-300
            class:delay-300={!duringTransition()}
            class:op-0={!duringTransition()}
            class:scale-80={!duringTransition()}
          />
        </div>
      </Show>
    </div>
  )
}
