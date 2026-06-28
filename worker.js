export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    const url = new URL(request.url);

    if (url.pathname === '/transcribe') {
      try {
        const fd = await request.formData();
        const wfd = new FormData();
        wfd.append('file', fd.get('file'), 'audio.webm');
        wfd.append('model', 'whisper-1');
        const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + env.OPENAI_KEY },
          body: wfd,
        });
        const d = await r.json();
        console.log('TRANSCRIPCION:', d.text);
        return new Response(JSON.stringify({ ok: true, transcription: d.text || '' }), {
          headers: Object.assign({ 'Content-Type': 'application/json' }, cors)
        });
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: e.message }), {
          status: 500, headers: Object.assign({ 'Content-Type': 'application/json' }, cors)
        });
      }
    }

    if (url.pathname === '/analyze') {
      try {
        const b = await request.json();
        console.log('ANALYZE categoria:', b.category);
        console.log('ANALYZE transcripcion:', b.transcription);

        const systemPrompt = "Ets el motor d'intel.ligencia de Talpot. Analitzes transcripcions de videos de candidats professionals i retornes UNICAMENT JSON valid sense cap text addicional ni markdown.";

        const userPrompt = "REGLES FONAMENTALS:\n1. DISTINGEIX entre el que la persona SAP FER (habilitat real) i el context on ha treballat. Exemple: coordinava amb logistica = capacitat de coordinacio interdepartamental, NO habilitat de logistica.\n2. INFEREIX soft skills del COM parla: seguretat = comunicacio efectiva; exemples amb xifres = orientacio a resultats; menciona equips = lideratge.\n3. DETECTA el ROL REAL: gestionava persones = lideratge; prenia decisions = autonomia; parlava amb clients = vendes/negociacio.\n4. EXTREU assoliments quantificables: anys experiencia, mida equips, volums, percentatges.\n5. ASSIGNA perfils professionals reals del mercat: Key Account Manager, Operations Manager, Business Development, etc.\n\nCATEGORIA: " + b.category + "\nTRANSCRIPCIO: " + b.transcription + "\n\nRetorna UNICAMENT aquest JSON:\n{\"keywords\":[\"minim 10 paraules clau del perfil professional real\"],\"habilitats_reals\":[\"habilitats que domina, no contextos de treball\"],\"competencies_transversals\":[\"soft skills inferides del discurs\"],\"experiencia\":{\"anys_totals\":\"nombre o buit\",\"rols_exercits\":[\"rols reals exercits\"],\"sectors_treballats\":[\"sectors on ha treballat\"]},\"assoliments\":[\"resultats concrets i quantificables\"],\"personality_traits\":[{\"name\":\"tret inferit del discurs\",\"score\":80}],\"perfils_professionals\":[\"perfils reals del mercat que encaixen\"],\"summary_for_seeker\":\"2-3 frases de qui es, que valor aporta i per a quin tipus empresa encaixa\"}";

        const r = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + env.OPENAI_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.1,
            max_tokens: 1500
          })
        });
        const d = await r.json();
        const raw = d.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
        console.log('GPT RESPONSE:', raw);
        return new Response(JSON.stringify({ ok: true, analysis: JSON.parse(raw) }), {
          headers: Object.assign({ 'Content-Type': 'application/json' }, cors)
        });
      } catch (e) {
        console.log('ERROR:', e.message);
        return new Response(JSON.stringify({ ok: false, error: e.message }), {
          status: 500, headers: Object.assign({ 'Content-Type': 'application/json' }, cors)
        });
      }
    }

    return new Response('Talpot AI Worker OK', { headers: cors });
  }
};
