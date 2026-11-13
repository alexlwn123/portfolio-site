/*
 * Where a part of the lid's script keeps what it knows between one event and
 * the next. The value in a store is never changed: it is replaced by a new
 * one, so a function that was handed the old value still has it whole.
 */
export interface Store<State> {
  readonly get: () => State
  readonly set: (next: State) => void
}

export function createStore<State>(initial: State): Store<State> {
  let state = initial
  return {
    get: () => state,
    set: (next) => {
      state = next
    },
  }
}
