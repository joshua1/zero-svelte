import { createSubscriber } from 'svelte/reactivity';
import { getContext } from 'svelte';
const emptyArray = [];
const defaultSnapshots = {
    singular: [undefined, { type: 'unknown' }],
    plural: [emptyArray, { type: 'unknown' }]
};
function getDefaultSnapshot(singular) {
    return (singular ? defaultSnapshots.singular : defaultSnapshots.plural);
}
class ViewWrapper {
    query;
    onMaterialized;
    onDematerialized;
    #view;
    #snapshot;
    #subscribe;
    constructor(query, onMaterialized, onDematerialized) {
        this.query = query;
        this.onMaterialized = onMaterialized;
        this.onDematerialized = onDematerialized;
        this.#snapshot = getDefaultSnapshot(query.format.singular);
        // Create a subscriber that manages view lifecycle
        this.#subscribe = createSubscriber((update) => {
            this.#materializeIfNeeded();
            if (this.#view) {
                // Pass the update function to onData so it can notify Svelte of changes
                this.#view.addListener((snap, resultType) => this.#onData(snap, resultType, update));
            }
            // Return cleanup function that will only be called
            // when all effects are destroyed
            return () => {
                this.#view?.destroy();
                this.#view = undefined;
                this.onDematerialized();
            };
        });
    }
    #onData = (snap, resultType, update) => {
        const data = snap === undefined
            ? snap
            : structuredClone(snap);
        this.#snapshot = [data, { type: resultType }];
        update(); // Notify Svelte that the data has changed
    };
    #materializeIfNeeded() {
        if (!this.#view) {
            this.#view = this.query.materialize();
            this.onMaterialized(this);
        }
    }
    // Used in Svelte components
    get current() {
        // This triggers the subscription tracking
        this.#subscribe();
        return this.#snapshot;
    }
}
class ViewStore {
    // eslint-disable-next-line
    #views = new Map();
    getView(clientID, query, enabled = true) {
        if (!enabled) {
            return new ViewWrapper(query, () => { }, () => { });
        }
        const hash = query.hash() + clientID;
        let existing = this.#views.get(hash);
        if (!existing) {
            existing = new ViewWrapper(query, (view) => {
                const lastView = this.#views.get(hash);
                if (lastView && lastView !== view) {
                    throw new Error('View already exists');
                }
                this.#views.set(hash, view);
            }, () => this.#views.delete(hash));
            this.#views.set(hash, existing);
        }
        return existing;
    }
}
export const viewStore = new ViewStore();
export class Query {
    current = $state(null);
    details = $state(null);
    #query_impl;
    constructor(query, z = null, enabled = true) {
        if (!z)
            z = getContext('z');
        const id = z?.current?.userID ? z?.current.userID : 'anon';
        this.#query_impl = query;
        const default_snapshot = getDefaultSnapshot(this.#query_impl.format.singular);
        this.current = default_snapshot[0];
        this.details = default_snapshot[1];
        const view = viewStore.getView(id, this.#query_impl, enabled);
        this.current = view.current[0];
        this.details = view.current[1];
        $effect(() => {
            this.current = view.current[0];
            this.details = view.current[1];
        });
    }
}
