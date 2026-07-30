/**
 * Minimal typed implementation of the Observer pattern.
 *
 * The publisher (subject) holds a list of observers and notifies each one when
 * an event is published. Observers are registered at startup and the publisher
 * never learns anything about them beyond the callback signature, which is what
 * keeps the coupling low: a new reaction to an event is a new subscriber, not an
 * edit to the code that raises the event.
 */
export type Observer<TPayload> = (payload: TPayload) => void | Promise<void>;

export class EventBus<TEvents extends Record<string, unknown>> {
    private readonly observers: {
        [K in keyof TEvents]?: Observer<TEvents[K]>[];
    } = {};

    /**
     * Attach an observer. Returns a function that detaches it again, which the
     * tests use to keep subscriptions from leaking between cases.
     */
    subscribe<K extends keyof TEvents>(
        event: K,
        observer: Observer<TEvents[K]>
    ): () => void {
        const existing = this.observers[event] ?? [];
        existing.push(observer);
        this.observers[event] = existing;

        return () => {
            this.observers[event] = (this.observers[event] ?? []).filter(
                (candidate) => candidate !== observer
            );
        };
    }

    /**
     * Notify every observer of an event.
     *
     * Observers run in parallel and one failing observer must not fail the
     * others, or the caller. A payment has already been taken by the time the
     * order events fire, so a failure to record analytics can be logged and
     * left for a later reconciliation rather than rolling the sale back.
     */
    async publish<K extends keyof TEvents>(
        event: K,
        payload: TEvents[K]
    ): Promise<void> {
        const observers = this.observers[event] ?? [];

        const results = await Promise.allSettled(
            observers.map((observer) => Promise.resolve(observer(payload)))
        );

        results.forEach((result) => {
            if (result.status === 'rejected') {
                console.error(
                    `Observer for event "${String(event)}" failed:`,
                    result.reason
                );
            }
        });
    }

    /** Detach every observer. Used between test cases. */
    clear(): void {
        (Object.keys(this.observers) as (keyof TEvents)[]).forEach((event) => {
            delete this.observers[event];
        });
    }

    /** Number of observers attached to an event, for assertions in tests. */
    observerCount<K extends keyof TEvents>(event: K): number {
        return (this.observers[event] ?? []).length;
    }
}
