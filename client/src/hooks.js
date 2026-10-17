import { useCallback, useEffect, useState } from 'react';
import { request } from './api';

export function useApi(path, { auth = 'customer' } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    request(path, { auth }).then(
      (data) => active && setState({ data, error: null, loading: false }),
      (error) => active && setState({ data: null, error, loading: false }),
    );
    return () => {
      active = false;
    };
  }, [path, auth, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, reload };
}

export function usePageTitle(title) {
  useEffect(() => {
    document.title = `${title}｜樂福推薦`;
  }, [title]);
}
