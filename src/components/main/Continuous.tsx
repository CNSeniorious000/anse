import { For, Show, createEffect, createSignal, on, onCleanup, onMount } from 'solid-js'
import { useStore } from '@nanostores/solid'
import { createScrollPosition } from '@solid-primitives/scroll'
import Lenis from '@studio-freight/lenis'
import { isSendBoxFocus } from '@/stores/ui'
import { useI18n } from '@/hooks'
import MessageItem from './MessageItem'
import type { Accessor } from 'solid-js'
import type { MessageInstance } from '@/types/message'

interface Props {
  conversationId: string
  messages: Accessor<MessageInstance[]>
}

export default (props: Props) => {
  let scrollRef: HTMLDivElement
  const { t } = useI18n()
  const $isSendBoxFocus = useStore(isSendBoxFocus)
  const [isScrollBottom, setIsScrollBottom] = createSignal(false)
  const scroll = createScrollPosition(() => scrollRef)

  createEffect(() => {
    setIsScrollBottom(scroll.y + scrollRef.clientHeight >= scrollRef.scrollHeight - 100)
  })
  createEffect(on(() => props.conversationId, () => {
    setTimeout(() => {
      instantScrollToBottom(scrollRef)
    }, 0)
  }))

  const instantScrollToBottom = (element: HTMLDivElement) => {
    isScrollBottom() && element.scrollTo({ top: element.scrollHeight, behavior: 'instant' })
  }

  const handleStreamableTextUpdate = () => {
    instantScrollToBottom(scrollRef)
  }

  let lenis: Lenis
  let observer: MutationObserver

  const initLenis = () => {
    lenis = new Lenis({ lerp: 0.35, wrapper: scrollRef, content: scrollRef, autoResize: false })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)
  }

  const resizeLenis = () => lenis.resize()

  onMount(() => {
    initLenis()
    observer = new MutationObserver(resizeLenis)
    observer.observe(scrollRef, { subtree: true, childList: true })
    window.addEventListener('resize', resizeLenis)
  })

  onCleanup(() => {
    lenis?.destroy()
    observer?.disconnect()
    window.removeEventListener('resize', resizeLenis)
  })

  return (
    <>
      <div class="flex flex-col h-full scroll-list relative overflow-y-scroll" ref={scrollRef!}>
        <div class="w-full mt-14">
          <For each={props.messages()}>
            {(message, index) => (
              <div class="border-b border-base">
                <MessageItem
                  conversationId={props.conversationId}
                  message={message}
                  handleStreaming={handleStreamableTextUpdate}
                  index={index()}
                />
              </div>
            )}
          </For>
        </div>
        {/* use for html2Canvas */}
        <div id="message_list_wrapper" class="m-auto w-full clipped hidden">
          <For each={props.messages().filter(item => item.isSelected)}>
            {(message, index) => (
              <div class="border-b border-base">
                <MessageItem
                  conversationId={props.conversationId}
                  message={message}
                  handleStreaming={handleStreamableTextUpdate}
                  index={index()}
                />
              </div>
            )}
          </For>
        </div>
      </div>
      <Show when={!isScrollBottom() && !$isSendBoxFocus()}>
        <div
          class="bg-blur border-t border-base right-0 bottom-0 left-0 absolute hv-base"
          onClick={() => scrollRef!.scrollTo({ top: scrollRef.scrollHeight, behavior: 'smooth' })}
        >
          <div class="max-w-base h-8 text-xs gap-1 fcc op-50">
            <div>{ t('scroll')}</div>
            <div i-carbon-chevron-down />
          </div>
        </div>
      </Show>
    </>
  )
}
