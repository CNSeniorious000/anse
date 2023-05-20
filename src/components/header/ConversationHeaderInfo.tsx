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

  let nowName = displayName()

  let nameTransitionLoop: NodeJS.Timer | null = null
  let titleTransitionLoop: NodeJS.Timeout | null = null

  createEffect(() => {
    const newName = currentConversation() ? (currentConversation().name || t('conversations.untitled')) : ''
    nameTransitionLoop && clearTimeout(nameTransitionLoop)

    const oldLength = nowName.length
    const newLength = newName.length

    function stepAfter(interval: number) {
      nameTransitionLoop = setTimeout(() => {
        setDuringTransition(true)
        console.log({ oldName: nowName, newName })
        if (nowName !== newName) {
          if (newName.startsWith(nowName)) {
            nowName = newName.slice(0, nowName.length + 1)
            setDisplayName(nowName)
            stepAfter(newLength * 40 / (nowName.length * (newLength - nowName.length)))
          } else {
            nowName = nowName.slice(0, -1)
            setDisplayName(nowName)
            stepAfter(oldLength * 40 / (nowName.length * (oldLength - nowName.length)))
          }
        } else {
          nameTransitionLoop = null
          setDuringTransition(false)
        }
      }, interval)
    }

    stepAfter(1)
  })

  createEffect(() => {
    let lastTitle = document.title
    const thisTitle = currentConversation() ? `Anse • ${currentConversation().name || 'New Chat'}` : 'Anse'
    titleTransitionLoop && clearInterval(titleTransitionLoop)
    titleTransitionLoop = setInterval(() => {
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
