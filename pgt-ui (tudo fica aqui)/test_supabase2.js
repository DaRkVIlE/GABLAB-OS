import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ptpojwbdxgmvykwwzatl.supabase.co';
const supabaseKey = 'sb_publishable_48LiDQdLxAh6v9G3ZyuIQw_QR7p_5tb';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('kairos_state').select('*').limit(1);
  if (error) console.log("error fetching kairos_state", error);
  else console.log("kairos_state", data);
  const { data: qData, error: qError } = await supabase.from('kairos_quests').select('*').limit(1);
  if (qError) console.log("error fetching kairos_quests", qError);
  else console.log("kairos_quests", qData);
}

check();
