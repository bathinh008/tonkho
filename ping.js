const { createClient } = require('@supabase/supabase-js');

// Khởi tạo Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function keepAlive() {
  console.log('--- Đang bắt đầu gửi ping tới Supabase ---');
  
  const { data, error } = await supabase
    .from('keep_alive')
    .insert([{ status: 'ping' }]);

  if (error) {
    console.error('Lỗi khi ping:', error.message);
    process.exit(1);
  } else {
    console.log('Ping thành công lúc:', new Date().toISOString());
  }
}

keepAlive();