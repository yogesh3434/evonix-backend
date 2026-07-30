
export type Observer<TPayload> = (payload: TPayload) => void | Promise<void>;

export class EventBus<TEvents extends Record<string, unknown>> {
    private readonly observers: {
        [K in keyof TEvents]?: Observer<TEvents[K]>[];
    } = {};

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

    clear(): void {
        (Object.keys(this.observers) as (keyof TEvents)[]).forEach((event) => {
            delete this.observers[event];
        });
    }

    observerCount<K extends keyof TEvents>(event: K): number {
        return (this.observers[event] ?? []).length;
    }
}
