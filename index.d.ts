import React = require('react')

export interface RenderProps {
  inView: boolean
  intersectionRatio: number
  intersection: IntersectionObserverEntry
  ref: React.RefObject<any>
}

export interface IntersectionOptions {
  /**
   * The `HTMLElement` that is used as the viewport for checking visibility of
   * the target.
   * Defaults to the browser viewport if not specified or if `null`.
   */
  root?: HTMLElement | null

  /**
   * Unique identifier for the root element - This is used to identify the
   * `IntersectionObserver` instance, so it can be reused.
   * If you defined a root element, without adding an `id`, it will create a new
   * instance for all components.
   */
  rootId?: string

  /**
   * Margin around the root.
   * Can have values similar to the CSS margin property,
   * e.g. `"10px 20px 30px 40px"` (top, right, bottom, left).
   */
  rootMargin?: string

  /** Number between 0 and 1 indicating the the percentage that should be
   * visible before triggering. Can also be an array of numbers, to create
   * multiple trigger points.
   * @default `0`
   */
  threshold?: number | number[]

  /**
   * Only trigger this method once
   * @default `false`
   */
  triggerOnce?: boolean
}

export interface IntersectionObserverProps extends IntersectionOptions {
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

export class InView extends React.Component<IntersectionObserverProps, {}> {}

export type useInView = (
  ref: React.RefObject<any>,
  options: IntersectionOptions,
) => boolean

export type useIntersectionObserver = (
  ref: React.RefObject<any>,
  options: IntersectionOptions,
) => {
  inView: boolean
  intersection: IntersectionObserverEntry
}

export default class ReactIntersectionObserver extends React.Component<
  IntersectionObserverProps,
  {}
> {}
