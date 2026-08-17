import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const cfg = window.AUTH_CONFIG || {};
const configured = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes('YOUR_PROJECT') && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.includes('YOUR_SUPABASE');
const $ = (id) => document.getElementById(id);
const money = (n) => new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(Number(n || 0)) + ' ج';

function showApp(session) {
  $('auth').hidden = true;
  $('app').hidden = false;
  $('userEmail').textContent = session.user.email || 'Authenticated user';
  loadData(session.user.id);
}
function showAuth() { $('auth').hidden = false; $('app').hidden = true; }

async function loadData(userId) {
  const { data: settings } = await supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle();
  const income = Number(settings?.monthly_income || 0);
  const wealth = Number(settings?.core_wealth || 0);
  $('income').textContent = money(income);
  $('wealth').textContent = money(wealth);
  $('rate').textContent = income ? ((wealth / income) * 100).toFixed(1) + '%' : '—';
  $('privateState').textContent = 'بياناتك محمية بـ RLS ومتصلة بحسابك فقط';
}

let supabase;
if (configured) {
  supabase = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  supabase.auth.getSession().then(({ data: { session } }) => session ? showApp(session) : showAuth());
  supabase.auth.onAuthStateChange((_event, session) => session ? showApp(session) : showAuth());
} else {
  $('configWarning').hidden = false;
  $('login').disabled = true;
  $('signup').disabled = true;
}

$('login').addEventListener('click', async () => {
  if (!supabase) return;
  const email = $('email').value.trim();
  const password = $('password').value;
  $('authMsg').textContent = 'جاري تسجيل الدخول…';
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  $('authMsg').textContent = error ? error.message : 'تم الدخول.';
});
$('signup').addEventListener('click', async () => {
  if (!supabase) return;
  const email = $('email').value.trim();
  const password = $('password').value;
  if (password.length < 12) { $('authMsg').textContent = 'استخدم كلمة مرور من 12 حرفًا على الأقل.'; return; }
  $('authMsg').textContent = 'جاري إنشاء الحساب…';
  const { error } = await supabase.auth.signUp({ email, password });
  $('authMsg').textContent = error ? error.message : 'تم إنشاء الحساب. تحقق من البريد الإلكتروني إذا كان تأكيد البريد مفعّلًا.';
});
$('logout').addEventListener('click', async () => { if (supabase) await supabase.auth.signOut(); });
