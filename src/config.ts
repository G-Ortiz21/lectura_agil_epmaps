const apiBaseUrlConfigurada = process.env.EXPO_PUBLIC_API_URL;

function validarApiBaseUrl(value: string | undefined): string {
  if (value === undefined || value.trim().length === 0) {
    throw new Error('Configura EXPO_PUBLIC_API_URL con la URL HTTPS de MockAPI.');
  }

  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error('EXPO_PUBLIC_API_URL debe ser una URL HTTPS absoluta válida.');
  }

  if (
    url.protocol !== 'https:' ||
    url.hostname.length === 0 ||
    url.username.length > 0 ||
    url.password.length > 0 ||
    url.search.length > 0 ||
    url.hash.length > 0
  ) {
    throw new Error(
      'EXPO_PUBLIC_API_URL debe usar HTTPS y no puede contener credenciales, consulta ni fragmento.',
    );
  }

  return url.toString().replace(/\/+$/, '');
}

export const API_BASE_URL = validarApiBaseUrl(apiBaseUrlConfigurada);

export const API_RESOURCES = {
  medidores: 'medidores',
  lecturas: 'lecturas',
} as const;