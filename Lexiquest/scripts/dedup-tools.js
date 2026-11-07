const fs = require('fs');
const files = ['my-aida-agents-hub/librechat.yaml', 'my-aida-agents-hub/aida-config.yaml'];

for (const f of files) {
  let c = fs.readFileSync(f, 'utf8');
  // Match duplicate tools blocks
  const regex = /(        tools:\r?\n          - "moodle_get_user_portal"\r?\n          - "moodle_award_xp"\r?\n          - "moodle_record_chunk_mastery"\r?\n)+/g;
  c = c.replace(regex, '        tools:\r\n          - "moodle_get_user_portal"\r\n          - "moodle_award_xp"\r\n          - "moodle_record_chunk_mastery"\r\n');
  fs.writeFileSync(f, c, 'utf8');
}
console.log('✅ Deduplication complete!');
