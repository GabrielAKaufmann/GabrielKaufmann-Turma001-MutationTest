import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Métricas customizadas
export const getBooksDuration = new Trend('get_books_duration', true);
export const successRate = new Rate('success_rate');

// Configurações de execução
export const options = {
  thresholds: {
    http_req_failed: ['rate<0.12'], // < 12% de falhas
    get_books_duration: ['p(95)<5700'], // 95% das respostas < 5700ms
    success_rate: ['rate>0.95'] // Taxa de sucesso > 95%
  },
  stages: [
    { duration: '1m', target: 10 }, // início com 10 VUs
    { duration: '2m', target: 150 }, // aumento gradual
    { duration: '2m', target: 300 } // atinge pico de 300 VUs
  ]
};

// Geração de relatórios
export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

// Função principal
export default function () {
  const res = http.get('https://fakerestapi.azurewebsites.net/api/v1/Books');

  getBooksDuration.add(res.timings.duration);
  successRate.add(res.status === 200);

  check(res, {
    'GET /Books - status 200': () => res.status === 200
  });
}
