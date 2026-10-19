// Prueba de rendimiento (carga) con k6 - Mastery Academy
// Ejecutar:  docker run --rm -i --network host -e BASE_URL=http://localhost:8080 grafana/k6 run - < pruebas/rendimiento/carga-api.js
// Escenario: hasta 50 usuarios virtuales navegando el catálogo y un administrador descargando reportes.
import http from 'k6/http';
import { check, sleep, group } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const ADMIN_USER = __ENV.ADMIN_USER || 'admin';
const ADMIN_PASS = __ENV.ADMIN_PASS || 'AdminStrongPass123!';

export const options = {
  scenarios: {
    catalogo: {
      executor: 'ramping-vus',
      exec: 'catalogo',
      stages: [
        { duration: '20s', target: 20 },
        { duration: '40s', target: 50 },
        { duration: '20s', target: 0 },
      ],
    },
    reportes: {
      executor: 'constant-vus',
      exec: 'reportes',
      vus: 2,
      duration: '80s',
    },
  },
  // Criterios de aceptación (SLA)
  thresholds: {
    http_req_failed: ['rate<0.01'],                       // < 1% de errores
    'http_req_duration{grupo:catalogo}': ['p(95)<500'],   // 95% del catálogo < 500 ms
    'http_req_duration{grupo:reportes}': ['p(95)<2000'],  // 95% de reportes < 2 s
  },
};

export function setup() {
  const res = http.post(`${BASE_URL}/api/auth/signin`,
    JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS }),
    { headers: { 'Content-Type': 'application/json' } });
  check(res, { 'login admin 200': (r) => r.status === 200 });
  return { token: res.json('token') || res.json('accessToken') };
}

export function catalogo() {
  group('catalogo', () => {
    const tags = { grupo: 'catalogo' };
    const list = http.get(`${BASE_URL}/api/courses`, { tags });
    check(list, { 'catálogo 200': (r) => r.status === 200 });
    check(http.get(`${BASE_URL}/api/categories`, { tags }), { 'categorías 200': (r) => r.status === 200 });
    check(http.get(`${BASE_URL}/api/news`, { tags }), { 'noticias 200': (r) => r.status === 200 });
  });
  sleep(1);
}

export function reportes(data) {
  const params = { headers: { Authorization: `Bearer ${data.token}` }, tags: { grupo: 'reportes' } };
  group('reportes', () => {
    check(http.get(`${BASE_URL}/api/reports/summary`, params), { 'resumen 200': (r) => r.status === 200 });
    check(http.get(`${BASE_URL}/api/reports/ventas?format=pdf`, params), { 'pdf 200': (r) => r.status === 200 });
    check(http.get(`${BASE_URL}/api/reports/inscripciones?format=xlsx`, params), { 'xlsx 200': (r) => r.status === 200 });
    check(http.get(`${BASE_URL}/api/reports/estudiantes?format=csv`, params), { 'csv 200': (r) => r.status === 200 });
  });
  sleep(2);
}
