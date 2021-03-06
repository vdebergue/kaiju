const styles = require('./select.styl')

import { update as copy } from 'immupdate'
import { Component, h, Message, ConnectParams, RenderParams, VNode, NoArgMessage } from 'kaiju'
import { Option } from 'space-lift'

import scroller from 'widget/scroller'
import loader from 'widget/loader'


/** A select component that can optionally display paginated data */
export default function<T>(props: Props<T>) {
  return Component<Props<T>, State>({ name: 'select', props, initState, connect, render })
}


interface Props<T> {
  items: T[]
  selectedItem: T
  onChange: Message<T>
  itemRenderer?: (item: T) => string
  loading: boolean
  pagination?: Pagination
}

interface Pagination {
  hasMore: boolean
  loadMore: NoArgMessage
}

interface State {
  opened: boolean
}

function initState() {
  return { opened: false }
}


const open = Message('open')
const close = Message('close')
const itemSelected = Message<[{}, MouseEvent]>('itemSelected')
const requestLoadMore = Message('requestLoadMore')


function connect<T>({ on, props, msg }: ConnectParams<Props<T>, State>) {

  on(open, state => copy(state, { opened: true }))
  on(close, state => copy(state, { opened: false }))

  on(itemSelected, (_, [item]) => msg.sendToParent(props().onChange(item as T)))

  Option(props().pagination).map(pagination => {
    on(requestLoadMore, _ => msg.sendToParent(pagination.loadMore()))
  })
}


function render<T>({ props, state }: RenderParams<Props<T>, State>) {
  const { items, selectedItem, itemRenderer } = props
  const { opened } = state

  const text = items.indexOf(selectedItem) > -1
    ? itemRenderer ? itemRenderer(selectedItem) : selectedItem.toString()
    : ''

  const dropdownEl = renderDropdownEl(props, opened)

  return [
    h('input', {
      props: { value: text },
      attrs: { readonly: true, placeholder: 'click me' },
      events: { click: open, blur: close }
    }),
    dropdownEl
  ]
}

function renderDropdownEl(props: Props<{}>, opened: boolean) {
  const { items, loading, itemRenderer, pagination } = props

  const itemEls = opened
    ? (itemRenderer ? items.map(itemRenderer) : items).map(renderItem)
    : undefined

  if (!itemEls) return ''

  const itemsWithLoaderEl = loading
    ? itemEls.concat(h(`li.${styles.loaderContainer}`, loader()))
    : itemEls

  const listEl = pagination ? (
    scroller({
      styleName: styles.scroller,
      list: itemsWithLoaderEl,
      hasMore: pagination.hasMore,
      loadMore: requestLoadMore,
      isLoadingMore: loading
    })
  ) : itemsWithLoaderEl

  return h(`ul.${styles.dropdown}`, { hook: animationHook }, listEl)
}

function renderItem(item: string) {
  return h(`li.${styles.li}`, { events: { mousedown: itemSelected.with(item) } }, item)
}

const animationHook = {
  insert: (vnode: VNode.Assigned) => {
    vnode.elm.classList.add(styles.insertAnimation)
  },

  remove: (vnode: VNode.Assigned, cb: () => void) => {
    vnode.elm.classList.add(styles.removeAnimation)
    vnode.elm.addEventListener('animationend', cb)
  }
}
