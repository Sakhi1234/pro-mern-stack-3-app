import { useCallback, useState } from 'react';
import Toast from '../components/Toast.jsx';

export default function withToast(OriginalComponent) {
  return function ToastWrapper(props) {
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    const showSuccess = useCallback((message) => {
      setToastType('success');
      setToastMessage(message);
      setToastVisible(true);
    }, []);

    const showError = useCallback((message) => {
      setToastType('error');
      setToastMessage(message);
      setToastVisible(true);
    }, []);

    return (
      <>
        <OriginalComponent
          {...props}
          showError={showError}
          showSuccess={showSuccess}
          dismissToast={() => setToastVisible(false)}
        />
        <Toast
          severity={toastType}
          showing={toastVisible}
          onDismiss={() => setToastVisible(false)}
        >
          {toastMessage}
        </Toast>
      </>
    );
  };
}
