import { readFile } from 'node:fs/promises';
const file = 'content-imports/preparatory/new-hello/Prep_3_New_Hello_Units_1_to_6_Full_Curriculum.html';
const html = await readFile(file, 'utf8');
const forbidden = ['data-bard-client-injected', '__initial_auth_token', '__firebase_config'];
const found = forbidden.filter((marker) => html.includes(marker));
if (found.length) {
  console.error('Temporary browser-injected authentication material remains in the Prep 3 New Hello source: ' + found.join(', '));
  process.exitCode = 1;
} else {
  console.log('Prep 3 New Hello source security check passed: no temporary browser-injected auth material.');
}
