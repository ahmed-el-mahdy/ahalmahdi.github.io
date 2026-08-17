import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const cfg = window.AUTH_CONFIG || {};
const configured = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes('YOUR_PROJECT') && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.includes('YOUR_SUPABASE');
const $ = (id) => document.getElementById(id);
const money = (n) => new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(Number(n || 0)) + ' ج';
const dashboardUrl = () => `${window.location.origin}${window.location.pathname}`;

let supabase;

function showApp(session) {
  $('auth').hidden = true;
  $('app').hidden = false;
  $('userEmail').textContent = session.user.email || 'Authenticated user';
  loadData(session.user.id);
}
function showAuth() { $('auth').hidden = false; $('app').hidden = true; }
function setMsg(el, text, type = '') { el.textContent = text; el.className = `msg ${type}`; }
function openPasswordModal() { $('passwordModal').hidden = false; $('newPassword').value = ''; $('confirmPassword').value = ''; setMsg($('passwordMsg'), ''); }
function closePasswordModal() { $('passwordModal').hidden = true; }

async function loadData(userId) {
  const { data: settings, error } = await supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle();
  if (error) {
    $('privateState').textContent = 'قاعدة البيانات لم تُجهّز بعد. نفّذ supabase-schema.sql في Supabase SQL Editor.';
    $('income').textContent = '—'; $('wealth').textContent = '—'; $('rate').textContent = '—'; return;
  }
  if (!settings) {
    const { data: created, error: createError } = await supabase.from('user_settings').insert({ user_id: userId }).select().single();
    if (createError) { $('privateState').textContent = 'تعذر إنشاء إعدادات الحساب. تأكد من تشغيل schema وRLS.'; return; }
    renderSettings(created); return;
  }
  renderSettings(settings);
}

function renderSettings(settings) {
  const income = Number(settings?.monthly_income || 0);
  const wealth = Number(settings?.core_wealth || 0);
  $('income').textContent = money(income);
  $('wealth').textContent = money(wealth);
  $('rate').textContent = income ? ((wealth / income) * 100).toFixed(1) + '%' : '—';
  $('privateState').textContent = 'بياناتك محمية بـ RLS ومتصلة بحسابك فقط';
}

async function requestPasswordReset() {
  if (!supabase) return;
  const email = $('email').value.trim();
  if (!email) { setMsg($('authMsg'), 'أدخل بريدك الإلكتروني أولًا لاستلام رابط إعادة تعيين كلمة المرور.', 'error'); $('email').focus(); return; }
  setMsg($('authMsg'), 'جاري إرسال رابط إعادة تعيين كلمة المرور…');
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: dashboardUrl() });
  setMsg($('authMsg'), error ? error.message : 'تم إرسال الرابط. افحص بريدك الإلكتروني واتبع الرابط لإعادة تعيين كلمة المرور.', error ? 'error' : 'success');
}

async function saveNewPassword() {
  if (!supabase) return;
  const password = $('newPassword').value;
  const confirm = $('confirmPassword').value;
  if (password.length < 12) { setMsg($('passwordMsg'), 'استخدم كلمة مرور من 12 حرفًا على الأقل.', 'error'); return; }
  if (password !== confirm) { setMsg($('passwordMsg'), 'كلمتا المرور غير متطابقتين.', 'error'); return; }
  setMsg($('passwordMsg'), 'جاري تحديث كلمة المرور…');
  const { error } = await supabase.auth.updateUser({ password });
  if (error) { setMsg($('passwordMsg'), error.message, 'error'); return; }
  setMsg($('passwordMsg'), 'تم تغيير كلمة المرور بنجاح.', 'success');
  setTimeout(closePasswordModal, 900);
}

if (configured) {
  supabase = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  supabase.auth.getSession().then(({ data: { session } }) => session ? showApp(session) : showAuth());
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') { showApp(session); openPasswordModal(); return; }
    session ? showApp(session) : showAuth();
  });
} else {
  $('configWarning').hidden = false; $('login').disabled = true; $('signup').disabled = true; $('forgot').disabled = true;
}

$('login').addEventListener('click', async () => {
  if (!supabase) return;
  const email = $('email').value.trim(); const password = $('password').value;
  if (!email || !password) { setMsg($('authMsg'), 'أدخل البريد الإلكتروني وكلمة المرور.', 'error'); return; }
  setMsg($('authMsg'), 'جاري تسجيل الدخول…');
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  setMsg($('authMsg'), error ? error.message : 'تم الدخول.', error ? 'error' : 'success');
});

$('signup').addEventListener('click', async () => {
  if (!supabase) return;
  const email = $('email').value.trim(); const password = $('password').value;
  if (!email || !password) { setMsg($('authMsg'), 'أدخل البريد الإلكتروني وكلمة المرور.', 'error'); return; }
  if (password.length < 12) { setMsg($('authMsg'), 'استخدم كلمة مرور من 12 حرفًا على الأقل.', 'error'); return; }
  setMsg($('authMsg'), 'جاري إنشاء الحساب…');
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) setMsg($('authMsg'), error.message, 'error');
  else if (!data.session) setMsg($('authMsg'), 'تم إنشاء الحساب. افتح رسالة التأكيد في بريدك الإلكتروني ثم سجّل الدخول.', 'success');
  else setMsg($('authMsg'), 'تم إنشاء الحساب وتسجيل الدخول.', 'success');
});

$('forgot').addEventListener('click', requestPasswordReset);
$('changePassword').addEventListener('click', openPasswordModal);
$('closePasswordModal').addEventListener('click', closePasswordModal);
$('cancelPassword').addEventListener('click', closePasswordModal);
$('savePassword').addEventListener('click', saveNewPassword);
$('logout').addEventListener('click', async () => { if (supabase) await supabase.auth.signOut(); });
