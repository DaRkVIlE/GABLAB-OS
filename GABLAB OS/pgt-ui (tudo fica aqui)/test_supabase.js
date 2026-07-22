import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ptpojwbdxgmvykwwzatl.supabase.co';
const supabaseKey = 'sb_publishable_48LiDQdLxAh6v9G3ZyuIQw_QR7p_5tb';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('kairos_events').select('*').limit(1);
  if (error) console.error(error);
  else console.log(data);
}

check();
