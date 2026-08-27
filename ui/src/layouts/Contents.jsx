import { Navigate, Route, Routes } from 'react-router-dom';
import routes from '../routes/routes.js';

export default function Contents() {
  return (
    <Routes>
      {routes.map((route, index) => {
        if (route.redirectTo) {
          return (
            <Route
              key={index}
              path={route.path}
              element={<Navigate to={route.redirectTo} replace={Boolean(route.replace)} />}
            />
          );
        }
        const Component = route.component;
        return <Route key={index} path={route.path} element={<Component />} />;
      })}
    </Routes>
  );
}
