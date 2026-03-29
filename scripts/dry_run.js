import { CaptureStore } from '../extension/background/store.js';
import { buildSpec, specToYAML } from '../shared/openapi-builder.js';
import { writeFileSync } from 'fs';

const store = new CaptureStore();

// 1. Simulate browsing JSONPlaceholder
const samples = [
  {
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/users',
    status: 200,
    responseBody: [
      { id: 1, name: 'Leanne Graham' },
      { id: 2, name: 'Ervin Howell' }
    ],
    responseHeaders: { 'content-type': 'application/json' }
  },
  {
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/users/1',
    status: 200,
    responseBody: { id: 1, name: 'Leanne Graham' },
    responseHeaders: { 'content-type': 'application/json' }
  },
  {
    method: 'POST',
    url: 'https://jsonplaceholder.typicode.com/posts',
    status: 201,
    requestBody: { title: 'Hello', userId: 1 },
    responseBody: { id: 101, title: 'Hello' },
    responseHeaders: { 'content-type': 'application/json' }
  }
];

console.log('--- Step 1: Adding samples to CaptureStore ---');
samples.forEach(s => store.add(s));
console.log(`Captured ${store.size()} requests.`);

console.log('\n--- Step 2: Building OpenAPI Spec ---');
const spec = buildSpec('https://jsonplaceholder.typicode.com', store.getEndpoints());
const yamlStr = specToYAML(spec);

console.log('\n--- Step 3: Writing spec to file ---');
writeFileSync('./mimicapi-test-spec.yaml', yamlStr);
console.log('File written: mimicapi-test-spec.yaml');
