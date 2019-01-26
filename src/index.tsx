import * as React from 'react'
import { observe, unobserve } from './intersection'
import invariant from 'invariant'
export { useInView } from './hooks/useInView'
export { useIntersectionObserver } from './hooks/useIntersectionObserver'

export type RenderProps = {
  inView: boolean
  intersection: IntersectionObserverEntry | undefined
  ref: React.RefObject<Element> | ((node?: Element) => void)
}

export type IntersectionOptions = {
  /** Number between 0 and 1 indicating the the percentage that should be visible before triggering. Can also be an array of numbers, to create multiple trigger points. */
  threshold?: number | Array<number>
  /** The HTMLElement that is used as the viewport for checking visibility of the target. Defaults to the browser viewport if not specified or if null.*/
  root?: Element
  /** Margin around the root. Can have values similar to the CSS margin property, e.g. "10px 20px 30px 40px" (top, right, bottom, left). */
  rootMargin?: string
  /** Only trigger the inView callback once */
  triggerOnce?: boolean
}

export type IntersectionObserverProps = IntersectionOptions & {
  /**
   * Children expects a function that receives an object
   * contain an `inView` boolean and `ref` that should be
   * assigned to the element root.
   */
  children?: React.ReactNode | ((fields: RenderProps) => React.ReactNode)

  /**
   * Element tag to use for the wrapping component
   * @default `'div'`
   */
  tag?: string

  /** Call this function whenever the in view state changes */
  onChange?: (inView: boolean, intersection: IntersectionObserverEntry) => void
}

type State = {
  inView: boolean
  intersection?: IntersectionObserverEntry
}

/**
 * Monitors scroll, and triggers the children function with updated props
 *
 <InView>
 {({inView, ref}) => (
   <h1 ref={ref}>{`${inView}`}</h1>
 )}
 </InView>
 */
export class InView extends React.Component<IntersectionObserverProps, State> {
  static defaultProps = {
    threshold: 0,
    triggerOnce: false,
  }

  state = {
    inView: false,
    intersection: undefined,
  }

  componentDidMount() {
    /* istanbul ignore else  */
    if (process.env.NODE_ENV !== 'production') {
      invariant(
        this.node,
        `react-intersection-observer: No DOM node found. Make sure you forward "ref" to the root DOM element you want to observe.`,
      )
    }
  }

  componentDidUpdate(prevProps: IntersectionObserverProps, prevState: State) {
    // If a IntersectionObserver option changed, reinit the observer
    if (
      prevProps.rootMargin !== this.props.rootMargin ||
      prevProps.root !== this.props.root ||
      prevProps.threshold !== this.props.threshold
    ) {
      unobserve(this.node)
      this.observeNode()
    }

    if (prevState.inView !== this.state.inView) {
      if (this.state.inView && this.props.triggerOnce) {
        unobserve(this.node)
        this.node = null
      }
    }
  }

  componentWillUnmount() {
    if (this.node) {
      unobserve(this.node)
      this.node = null
    }
  }

  node: HTMLElement | null = null

  observeNode() {
    if (!this.node) return
    const { threshold, root, rootMargin } = this.props
    observe(this.node, this.handleChange, {
      threshold,
      root,
      rootMargin,
    })
  }

  handleNode = (node?: HTMLElement) => {
    if (this.node) unobserve(this.node)
    this.node = node ? node : null
    this.observeNode()
  }

  handleChange = (inView: boolean, intersection: IntersectionObserverEntry) => {
    this.setState({ inView, intersection })
    if (this.props.onChange) {
      this.props.onChange(inView, intersection)
    }
  }

  render() {
    const {
      children,
      tag,
      triggerOnce,
      threshold,
      root,
      rootMargin,
      ...props
    } = this.props

    const { inView, intersection } = this.state

    if (typeof children === 'function') {
      // @ts-ignore doesn't properly detect the function here...
      return children({ inView, intersection, ref: this.handleNode })
    }

    return React.createElement(
      tag || 'div',
      { ref: this.handleNode, ...props },
      children,
    )
  }
}

export default InView
