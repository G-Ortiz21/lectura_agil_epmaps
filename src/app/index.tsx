import { Redirect } from 'expo-router';
import { useSesion } from '../contexts/SesionContext';

export default function IndexRoute() {
  const { estado } = useSesion();
  return <Redirect href={estado === 'autenticado' ? '/inicio' : '/login'} />;
}
