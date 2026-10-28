const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const { beforeEach, test } = require('node:test');
const ts = require('typescript');

process.env.EXPO_PUBLIC_API_URL = 'https://mockapi.example.invalid';

require.extensions['.ts'] = (modulo, nombreArchivo) => {
  const codigo = fs.readFileSync(nombreArchivo, 'utf8');
  const salida = ts.transpileModule(codigo, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  modulo._compile(salida, nombreArchivo);
};

const { ApiError } = require('../src/api/client.ts');
const {
  evaluarEstadoOficina,
  esMedidorOficina,
} = require('../src/domain/validaciones.ts');
const { buscarMedidorRemoto } = require('../src/api/medidoresApi.ts');

const medidorValido = {
  codigo: 'MED-123456',
  direccion: 'Calle de Ejemplo 100',
  sector: 'Centro',
  numeroCuenta: 'CTA-000123',
  estadoOficina: 'activo',
  ultimaLectura: 1250,
  fechaUltimaLectura: '2026-10-15',
  promedioMensual: 18.5,
};

const cacheState = { value: null, reads: 0, writes: [] };
const apiState = { result: null, calls: 0 };
const rutaServicio = require.resolve('../src/services/medidoresService.ts');
const cargarOriginal = Module._load;

Module._load = function cargarConDependenciasSimuladas(request, parent, isMain) {
  if (parent?.filename === rutaServicio) {
    if (request.endsWith('/data/repositories/medidoresRepository')) {
      return {
        obtenerMedidorCache: async () => {
          cacheState.reads += 1;
          return cacheState.value;
        },
        guardarMedidorCache: async (...argumentos) => {
          cacheState.writes.push(argumentos);
          cacheState.value = {
            codigo: argumentos[0],
            datos: argumentos[1],
            consultadoEn: argumentos[2].toISOString(),
          };
        },
      };
    }
    if (request.endsWith('/api/medidoresApi')) {
      return {
        buscarMedidorRemoto: async () => {
          apiState.calls += 1;
          if (apiState.result instanceof Error) {
            throw apiState.result;
          }
          return apiState.result;
        },
      };
    }
    if (request.endsWith('/api/client')) {
      return { ApiError };
    }
  }
  return cargarOriginal.call(this, request, parent, isMain);
};

const { consultarMedidor } = require('../src/services/medidoresService.ts');

function resetMocks() {
  cacheState.value = null;
  cacheState.reads = 0;
  cacheState.writes = [];
  apiState.result = { estado: 'encontrado', medidor: medidorValido };
  apiState.calls = 0;
}

beforeEach(resetMocks);

function errorDeTipo(kind) {
  return (error) => error instanceof ApiError && error.kind === kind;
}

test('acepta el contrato aprobado y elimina id del tipo de negocio', async () => {
  assert.equal(esMedidorOficina({ ...medidorValido, id: 'mock-1' }), true);
  const resultado = await buscarConRespuesta([
    { ...medidorValido, id: 'mock-1', propiedadExtra: 'ignorada' },
  ]);
  assert.equal(resultado.estado, 'encontrado');
  assert.equal('id' in resultado.medidor, false);
  assert.equal('propiedadExtra' in resultado.medidor, false);
});

test('rechaza propiedades obligatorias ausentes y tipos incompatibles', () => {
  const { sector: _sector, ...sinSector } = medidorValido;
  assert.equal(esMedidorOficina(sinSector), false);
  assert.equal(esMedidorOficina({ ...medidorValido, ultimaLectura: '1250' }), false);
  assert.equal(esMedidorOficina({ ...medidorValido, promedioMensual: -1 }), false);
  assert.equal(esMedidorOficina({ ...medidorValido, id: 12 }), false);
});

test('acepta valores nullable y requiere fecha y lectura juntas', () => {
  assert.equal(
    esMedidorOficina({
      ...medidorValido,
      sector: null,
      numeroCuenta: null,
      ultimaLectura: null,
      fechaUltimaLectura: null,
      promedioMensual: null,
    }),
    true,
  );
  assert.equal(
    esMedidorOficina({ ...medidorValido, fechaUltimaLectura: null }),
    false,
  );
});

test('rechaza códigos de medidor inválidos y fechas de calendario inválidas', () => {
  assert.equal(esMedidorOficina({ ...medidorValido, codigo: 'MED-12345' }), false);
  assert.equal(esMedidorOficina({ ...medidorValido, codigo: 'MED-123456\n' }), false);
  assert.equal(
    esMedidorOficina({ ...medidorValido, fechaUltimaLectura: '2026-02-30' }),
    false,
  );
  assert.equal(
    esMedidorOficina({
      ...medidorValido,
      fechaUltimaLectura: '2026-10-15\n',
    }),
    false,
  );
});

test('activo permite continuar, suspendido bloquea y un estado desconocido requiere revisión', () => {
  assert.equal(evaluarEstadoOficina('activo').permiteContinuar, true);
  assert.equal(evaluarEstadoOficina('suspendido').permiteContinuar, false);
  const desconocido = evaluarEstadoOficina('en_mantenimiento');
  assert.equal(desconocido.permiteContinuar, false);
  assert.equal(desconocido.requiereRevision, true);
});

test('la caché del día se usa sin una solicitud remota', async () => {
  resetMocks();
  const fecha = new Date(2026, 9, 28, 12);
  cacheState.value = {
    codigo: medidorValido.codigo,
    datos: medidorValido,
    consultadoEn: fecha.toISOString(),
  };
  const resultado = await consultarMedidor(medidorValido.codigo, true, fecha);
  assert.equal(resultado.estado, 'encontrado');
  assert.equal(resultado.origen, 'cache_local');
  assert.equal(apiState.calls, 0);
});

test('la caché antigua se actualiza al consultar con conexión', async () => {
  resetMocks();
  const fecha = new Date(2026, 9, 28, 12);
  cacheState.value = {
    codigo: medidorValido.codigo,
    datos: medidorValido,
    consultadoEn: new Date(2026, 9, 27, 12).toISOString(),
  };
  const resultado = await consultarMedidor(medidorValido.codigo, true, fecha);
  assert.equal(resultado.estado, 'encontrado');
  assert.equal(resultado.origen, 'oficina');
  assert.equal(cacheState.writes.length, 1);
});

test('sin conexión devuelve una caché antigua con su marca local de consulta', async () => {
  resetMocks();
  const consultadoEn = new Date(2026, 9, 20, 12).toISOString();
  cacheState.value = {
    codigo: medidorValido.codigo,
    datos: medidorValido,
    consultadoEn,
  };
  const resultado = await consultarMedidor(
    medidorValido.codigo,
    false,
    new Date(2026, 9, 28, 12),
  );
  assert.equal(resultado.estado, 'encontrado');
  assert.equal(resultado.origen, 'cache_local');
  assert.equal(resultado.consultadoEn, consultadoEn);
  assert.equal(apiState.calls, 0);
});

test('sin conexión y sin caché devuelve un resultado controlado', async () => {
  resetMocks();
  const resultado = await consultarMedidor(
    medidorValido.codigo,
    false,
    new Date(2026, 9, 28, 12),
  );
  assert.deepEqual(resultado, {
    estado: 'sin_cache_sin_conexion',
    codigo: medidorValido.codigo,
  });
  assert.equal(apiState.calls, 0);
});

test('código inválido no consulta ni caché', async () => {
  resetMocks();
  await assert.rejects(
    consultarMedidor('MED-12345', true),
    TypeError,
  );
  assert.equal(cacheState.reads, 0);
  assert.equal(apiState.calls, 0);
});

test('respuesta remota inválida no crea ni sobrescribe caché', async () => {
  apiState.result = new ApiError(
    'invalid_response',
    'La respuesta del medidor no cumple el contrato acordado.',
  );
  await assert.rejects(
    consultarMedidor(medidorValido.codigo, true, new Date(2026, 9, 28, 12)),
    errorDeTipo('invalid_response'),
  );
  assert.equal(cacheState.value, null);
  assert.equal(cacheState.writes.length, 0);

  const anterior = {
    codigo: medidorValido.codigo,
    datos: medidorValido,
    consultadoEn: new Date(2026, 9, 27, 12).toISOString(),
  };
  cacheState.value = anterior;
  assert.equal(cacheState.value, anterior);
  await assert.rejects(
    consultarMedidor(medidorValido.codigo, true, new Date(2026, 9, 28, 12)),
    errorDeTipo('invalid_response'),
  );
  assert.equal(cacheState.value, anterior);
  assert.equal(cacheState.writes.length, 0);
});

test('un error de red permite reutilizar la caché antigua sin sobrescribirla', async () => {
  const anterior = {
    codigo: medidorValido.codigo,
    datos: medidorValido,
    consultadoEn: new Date(2026, 9, 27, 12).toISOString(),
  };
  cacheState.value = anterior;
  apiState.result = new ApiError('network', 'No se pudo conectar.');

  const resultado = await consultarMedidor(
    medidorValido.codigo,
    true,
    new Date(2026, 9, 28, 12),
  );
  assert.equal(resultado.estado, 'encontrado');
  assert.equal(resultado.origen, 'cache_local');
  assert.equal(cacheState.value, anterior);
  assert.equal(cacheState.writes.length, 0);
});

test('la API distingue 404 de otros errores HTTP', async () => {
  await conFetch(async () => new Response('', { status: 404 }), async () => {
    await assert.rejects(
      buscarMedidorRemoto(medidorValido.codigo),
      errorDeTipo('not_found'),
    );
  });
  await conFetch(async () => new Response('', { status: 503 }), async () => {
    await assert.rejects(
      buscarMedidorRemoto(medidorValido.codigo),
      errorDeTipo('http'),
    );
  });
});

test('la API distingue JSON inválido y respuesta inválida', async () => {
  await conFetch(
    async () => new Response('{invalid', { status: 200 }),
    async () => {
      await assert.rejects(
        buscarMedidorRemoto(medidorValido.codigo),
        errorDeTipo('invalid_json'),
      );
    },
  );
  await conFetch(
    async () => Response.json([{ ...medidorValido, codigo: 45 }]),
    async () => {
      await assert.rejects(
        buscarMedidorRemoto(medidorValido.codigo),
        errorDeTipo('invalid_response'),
      );
    },
  );
});

test('la API distingue errores de conexión', async () => {
  await conFetch(async () => {
    throw new TypeError('network unreachable');
  }, async () => {
    await assert.rejects(
      buscarMedidorRemoto(medidorValido.codigo),
      errorDeTipo('network'),
    );
  });
});

test('la API identifica un medidor inexistente', async () => {
  await conFetch(async () => Response.json([]), async () => {
    assert.deepEqual(await buscarMedidorRemoto(medidorValido.codigo), {
      estado: 'no_encontrado',
    });
  });
});

test('la API clasifica timeout de 10 segundos', async () => {
  const setTimeoutOriginal = global.setTimeout;
  const clearTimeoutOriginal = global.clearTimeout;
  const fetchOriginal = global.fetch;
  global.setTimeout = (callback) => {
    queueMicrotask(callback);
    return 1;
  };
  global.clearTimeout = () => {};
  global.fetch = async (_url, options) =>
    new Promise((_resolve, reject) => {
      options.signal.addEventListener(
        'abort',
        () => reject(new DOMException('Aborted', 'AbortError')),
        { once: true },
      );
    });

  try {
    await assert.rejects(
      buscarMedidorRemoto(medidorValido.codigo),
      errorDeTipo('timeout'),
    );
  } finally {
    global.setTimeout = setTimeoutOriginal;
    global.clearTimeout = clearTimeoutOriginal;
    global.fetch = fetchOriginal;
  }
});

async function buscarConRespuesta(respuesta) {
  return conFetch(
    async () => Response.json(respuesta),
    () => buscarMedidorRemoto(medidorValido.codigo),
  );
}

async function conFetch(fetchSimulado, ejecutar) {
  const fetchOriginal = global.fetch;
  global.fetch = fetchSimulado;
  try {
    return await ejecutar();
  } finally {
    global.fetch = fetchOriginal;
  }
}
