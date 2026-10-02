const dns = require('dns').promises;

async function checkDNS() {
  console.log('=== DNS INVENTORY FOR mahiskills.in ===');
  
  const query = async (fn, type) => {
    try {
      const res = await fn('mahiskills.in');
      console.log('[' + type + ']', JSON.stringify(res, null, 2));
    } catch (e) {
      console.log('[' + type + '] (None or error: ' + (e.code || e.message) + ')');
    }
  };

  await query(dns.resolveNs, 'NS');
  await query(dns.resolve4, 'A');
  await query(dns.resolve6, 'AAAA');
  await query(dns.resolveMx, 'MX');
  await query(dns.resolveTxt, 'TXT');

  try {
    const www = await dns.resolve4('www.mahiskills.in');
    console.log('[www.mahiskills.in A]', JSON.stringify(www, null, 2));
  } catch (e) {
    console.log('[www.mahiskills.in A] (None or error: ' + (e.code || e.message) + ')');
  }

  try {
    const api4k = await dns.resolve('api4k.mahiskills.in');
    console.log('[api4k.mahiskills.in]', JSON.stringify(api4k, null, 2));
  } catch (e) {
    console.log('[api4k.mahiskills.in] (Record does NOT exist: ' + (e.code || e.message) + ')');
  }
}

checkDNS().catch(console.error);
