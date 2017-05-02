import 'intersection-observer'

const INSTANCE_MAP = new Map()
const OBSERVER_MAP = new Map()

/**
 * Monitor element, and trigger callback when element becomes visible
 * @param element {HTMLElement}
 * @param callback {Function} - Called with inView
 * @param removeWhenVisible {Boolean} Removes the observer when it's triggered the first time.
 * @param threshold {Number} Number between 0 and 1, indicating how much of the element should be visible before triggering
 */
export function observe(
  element,
  callback,
  removeWhenVisible = true,
  threshold = 0,
) {
  if (!element || !callback) return
  let observerInstance = OBSERVER_MAP.get(threshold)
  if (!observerInstance) {
    observerInstance = new IntersectionObserver(onChange, { threshold })
    OBSERVER_MAP.set(threshold, observerInstance)
  }

  INSTANCE_MAP.set(element, {
    callback,
    removeWhenVisible,
    visible: false,
    threshold,
  })
  observerInstance.observe(element)
}

/**
 * Stop observing an element. If an element is removed from the DOM or otherwise destroyed,
 * make sure to call this method. This is called automatically if an element has "removeWhenVisible" set to true.
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

    const itemsLeft = Array.from(INSTANCE_MAP.values()).some(
      item => item.threshold === instance.threshold,
    )

    if (observerInstance && !itemsLeft) {
      // No more elements to observe, disconnect
      observerInstance.disconnect()
      OBSERVER_MAP.delete(instance.threshold)
    }
  }
}

function onChange(changes) {
  changes.forEach(intersection => {
    if (INSTANCE_MAP.has(intersection.target)) {
      const {
        callback,
        removeWhenVisible,
        visible,
        threshold,
      } = INSTANCE_MAP.get(intersection.target)
      // Trigger on 0 ratio only when not visible.
      const inView = visible
        ? intersection.intersectionRatio > threshold
        : intersection.intersectionRatio >= threshold

      if (callback) {
        callback(inView)
      }

      // Remove element once it becomes visible
      if (removeWhenVisible) {
        unobserve(intersection.target)
      } else {
        INSTANCE_MAP.set(intersection.target, {
          callback,
          removeWhenVisible,
          visible: inView,
          threshold,
        })
      }
    }
  })
}

export default {
  observe,
  unobserve,
}
