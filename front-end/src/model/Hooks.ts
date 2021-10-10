import { useEffect, useState } from "react";
import { Observable } from "rxjs";

export function useSubscription<T, S>(defaultVal: T, observable: () => Observable<S>): T | S {
  const [state, setState] = useState<T | S>(defaultVal);

  useEffect(() => {
    const subscription = observable().subscribe(message => setState(message));
    return subscription.unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return state;
}