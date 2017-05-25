const INSTANCE_MAP = new Map()
const OBSERVER_MAP = new Map()

/**
 * Monitor element, and trigger callback when element becomes visible
 * @param element {HTMLElement}
 * @param callback {Function} - Called with inView
 * @param threshold {Number} Number between 0 and 1, indicating how much of the element should be visible before triggering
 */
export function observe(element, callback, threshold = 0) {
  if (!element || !callback) return
  let observerInstance = OBSERVER_MAP.get(threshold)
  if (!observerInstance) {
    observerInstance = new IntersectionObserver(onChange, { threshold })
    OBSERVER_MAP.set(threshold, observerInstance)
  }

  INSTANCE_MAP.set(element, {
    callback,
    visible: false,
    threshold,
  })
  observerInstance.observe(element)
}

/**
 * Stop observing an element. If an element is removed from the DOM or otherwise destroyed,
 * make sure to call this method.
 * @param element {HTMLElement}
 */
export function unobserve(element) {
  if (!element) return
  const instance = INSTANCE_MAP.get(element)

  if (instance) {
    INSTANCE_MAP.delete(element)

    const observerInstance = OBSERVER_MAP.get(instance.threshold)
    if (observerInstance) {
      observerInstance.unobserve(element)
    }

    // Check if we are stilling observing any elements with the same threshold.
    let itemsLeft = false
    INSTANCE_MAP.forEach(item => {
      if (item.threshold === instance.threshold) {
        itemsLeft = true
      }
    })

    if (observerInstance && !itemsLeft) {
      // No more elements to observe for threshold, disconnect observer
      observerInstance.disconnect()
      OBSERVER_MAP.delete(instance.threshold)
    }
  }
}

function onChange(changes) {
  changes.forEach(intersection => {
    if (INSTANCE_MAP.has(intersection.target)) {
      const { isIntersecting, intersectionRatio, target } = intersection
      const { callback, visible, threshold } = INSTANCE_MAP.get(target)

      // Trigger on 0 ratio only when not visible. This is fallback for browsers without isIntersecting support
      let inView = visible
        ? intersectionRatio > threshold
        : intersectionRatio >= threshold

      if (isIntersecting !== undefined) {
        // If isIntersecting is defined, ensure that the element is actually intersecting.
        // Otherwise it reports a threshold of 0
        inView = inView && isIntersecting
      }

      INSTANCE_MAP.set(target, {
        callback,
        visible: inView,
        threshold,
      })

      if (callback) {
        callback(inView)
      }
    }
  })
}

export default {
  observe,
  unobserve,
}
