import { ObserverInstanceCallback } from './index';

const ObserverMap = new Map<
  string,
  {
    id: string;
    observer: IntersectionObserver;
    elements: Map<Element, Array<ObserverInstanceCallback>>;
  }
>();

const RootIds: Map<Element, string> = new Map();

let consecutiveRootId = 0;

/**
 * Generate a unique ID for the root element
 * @param root
 */
function getRootId(root?: Element | null) {
  if (!root) return '';
  if (RootIds.has(root)) return RootIds.get(root);
  consecutiveRootId += 1;
  RootIds.set(root, consecutiveRootId.toString());
  return RootIds.get(root);
}

/**
 * Convert the options to a string Id, based on the values.
 * Ensures we can reuse the same observer for, when observer elements with the same options.
 * @param options
 */
export function optionsToId(options: IntersectionObserverInit) {
  const values = Object.keys(options)
    .sort()
    .map((key) => {
      let value = options[key];
      if (key === 'root') {
        value = getRootId(options.root);
      }
      return `${key}_${value}`;
    });

  return values.join('|');
}

function createObserver(options: IntersectionObserverInit) {
  // Create a unique ID for this observer instance, based on the root, root margin and threshold.
  let id = optionsToId(options);
  let instance = ObserverMap.get(id);

  if (!instance) {
    // Create a map of elements this observer is going to observe. Each element has a list of callbacks that should be triggered, once it comes into view.
    const elements = new Map<Element, Array<ObserverInstanceCallback>>();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        // While it would be nice if you could just look at isIntersecting to determine if the component is inside the viewport, browsers can't agree on how to use it.
        // -Firefox ignores `threshold` when considering `isIntersecting`, so it will never be false again if `threshold` is > 0
        const inView = observer.thresholds.some((threshold) => {
          return !entry.isIntersecting
            ? // The intersectionRatio should be more than the threshold to be considered inside the viewport
              entry.intersectionRatio > threshold
            : // If we're not intersecting, make sure we accept `intersectionRatio` 0 as not inside the viewport
              entry.intersectionRatio >= threshold;
        });

        // @ts-ignore support IntersectionObserver v2
        if (options.trackVisibility && typeof entry.isVisible === 'undefined') {
          // The browser doesn't support Intersection Observer v2, falling back to v1 behavior.
          // @ts-ignore
          entry.isVisible = inView;
        }

        elements.get(entry.target)?.forEach((callback) => {
          callback(inView && entry.isIntersecting, entry);
        });
      });
    }, options);

    instance = {
      id,
      observer,
      elements,
    };

    ObserverMap.set(id, instance);
  }

  return instance;
}

export function observe(
  element: Element,
  callback: ObserverInstanceCallback,
  options: IntersectionObserverInit = {},
) {
  if (!element) return () => {};
  // An observer with the same options can be reused, so lets use this fact
  const { id, observer, elements } = createObserver(options);

  // Register the callback listener for this element
  let callbacks = elements.get(element) || [];
  if (!elements.has(element)) {
    elements.set(element, callbacks);
  }

  callbacks.push(callback);
  observer.observe(element);

  return function unobserve() {
    // Remove the callback from the callback list
    callbacks.splice(callbacks.indexOf(callback), 1);

    if (callbacks.length === 0) {
      // No more callback exists for element, so destroy it
      elements.delete(element);
      observer.unobserve(element);
    }

    if (elements.size === 0) {
      // No more elements are being observer by this instance, so destroy it
      observer.disconnect();
      ObserverMap.delete(id);
    }
  };
}