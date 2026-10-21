/* 12d/12e Platform: een klein, werkend voorbeeld van een platform op maat (werkomgeving voor het team en portaal voor de klant), in het Nederlands en het Engels.
   Gewone JavaScript, geen bibliotheek, geen netwerkverzoeken, niets wordt opgeslagen. Alle gegevens zijn verzonnen en staan alleen in het geheugen van deze pagina.
   Er beweegt niets vanzelf: alles verandert pas na een klik, tik of toets. De taal komt uit <html lang>. */
(function () {
  'use strict';
  var root = document.getElementById('pf');
  if (!root) return;
  var EN = document.documentElement.getAttribute('lang') === 'en';
  var X = function (nl, en) { return EN ? en : nl; };

  var cfg = {};
  try { cfg = JSON.parse(document.getElementById('pf-data').textContent); } catch (err) { cfg = {}; }
  var ASST = cfg.assistenten || [X('Klantenassistent', 'Customer assistant'), X('Planning-assistent', 'Planning assistant'), X('Rapport-assistent', 'Report assistant')];

  var STATUS = [['nieuw', X('Nieuw', 'New')], ['bezig', X('In behandeling', 'In progress')], ['wacht', X('Wacht op klant', 'Waiting for customer')], ['klaar', X('Klaar', 'Done')]];
  var STATUS_L = { nieuw: STATUS[0][1], bezig: STATUS[1][1], wacht: STATUS[2][1], klaar: STATUS[3][1] };
  var STATUS_S = { nieuw: 'draft', bezig: 'prog', wacht: 'todo', klaar: 'done' };
  var SOORTEN = ['Aanvraag', 'Afspraak', 'Wijziging', 'Onderhoud', 'Levering', 'Rapport'];
  var SOORT_L = EN ? { Aanvraag: 'Request', Afspraak: 'Appointment', Wijziging: 'Change', Onderhoud: 'Maintenance', Levering: 'Delivery', Rapport: 'Report' } : { Aanvraag: 'Aanvraag', Afspraak: 'Afspraak', Wijziging: 'Wijziging', Onderhoud: 'Onderhoud', Levering: 'Levering', Rapport: 'Rapport' };
  var DAGEN = ['Ma', 'Di', 'Wo', 'Do', 'Vr'];
  var DAG_S = EN ? { Ma: 'Mon', Di: 'Tue', Wo: 'Wed', Do: 'Thu', Vr: 'Fri' } : { Ma: 'Ma', Di: 'Di', Wo: 'Wo', Do: 'Do', Vr: 'Vr' };
  var DAG_L = EN ? { Ma: 'Monday', Di: 'Tuesday', Wo: 'Wednesday', Do: 'Thursday', Vr: 'Friday' } : { Ma: 'maandag', Di: 'dinsdag', Wo: 'woensdag', Do: 'donderdag', Vr: 'vrijdag' };
  var KLANT = function (l) { return X('Klant ', 'Customer ') + l; };
  var KLANTEN = ['A', 'B', 'C', 'D', 'E'].map(KLANT);
  var PORTAAL_KLANT = KLANT('B');
  var VANDAAG = 'Ma';
  var VIEWS = [['overzicht', X('Overzicht', 'Overview')], ['dossiers', X('Dossiers', 'Cases')], ['planning', 'Planning'], ['assistent', X('Assistent', 'Assistant')], ['koppelingen', X('Koppelingen', 'Integrations')]];
  var ROL_M = X('Medewerker', 'Staff member'), ROL_P = X('Planner', 'Planner');
  var TEAM = 'Team';
  var NU = X('Zojuist', 'Just now'), EERDER = X('Eerder vandaag', 'Earlier today'), GISTEREN = X('Gisteren', 'Yesterday'), VANDAAG_T = X('Vandaag', 'Today');

  var IC = {
    overzicht: 'M2.5 2.5h4.5v4.5H2.5z M9 2.5h4.5v4.5H9z M2.5 9h4.5v4.5H2.5z M9 9h4.5v4.5H9z',
    dossiers: 'M4 2.5h5.5L12.5 5.5V13.5H4z M9.5 2.5v3h3 M6 8.5h4.5 M6 11h4.5',
    planning: 'M2.5 4h11v9.5h-11z M2.5 7h11 M5.5 2.5v3 M10.5 2.5v3',
    assistent: 'M4 3.5h8v10H4z M6.2 2h3.6v2.6H6.2z M6 8h4 M6 10.5h4',
    koppelingen: 'M6.6 9.4l2.8-2.8 M5.2 7.4L4 8.6a2.3 2.3 0 0 0 3.4 3.4l1.2-1.2 M10.8 8.6L12 7.4a2.3 2.3 0 0 0-3.4-3.4L7.4 5.2',
    plus: 'M8 3.5v9 M3.5 8h9',
    close: 'M4 4l8 8 M12 4l-8 8',
    back: 'M10 3.5L5.5 8l4.5 4.5',
    left: 'M9.5 4L5.5 8l4 4',
    right: 'M6.5 4l4 4-4 4',
    reset: 'M3 8a5 5 0 1 0 1.6-3.7 M3 2.8v3.2h3.2',
    check: 'M3.4 7.3l2.4 2.4 4.8-5.2',
    send: 'M2.5 8l11-5-3.5 10-2.5-4z'
  };
  var ic = function (k) { return '<svg class="ic" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="' + IC[k] + '"/></svg>'; };
  var st = function (k) { return '<svg class="st st-' + k + '" viewBox="0 0 14 14" aria-hidden="true" focusable="false"><use href="#st-' + k + '"/></svg>'; };
  var h = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var $ = function (s, c) { return (c || root).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || root).querySelectorAll(s)); };

  /* ---------- gegevens ---------- */
  function seed() {
    var steps = function () { return Array.prototype.slice.call(arguments).map(function (a) { return { t: a[0], done: !!a[1] }; }); };
    return {
      mode: 'team', view: 'overzicht', sel: null, filter: 'alle', q: '', sort: { k: 'dag', dir: 1 },
      seq: 1051, drafts: {}, chat: [], chatDraft: '', asstSel: 0, asstOn: [true, true, true], focusKey: null,
      d: [
        { id: 'D-1041', titel: X('Nieuwe aanvraag beantwoorden', 'Answer new request'), klant: KLANT('B'), soort: 'Aanvraag', status: 'nieuw', dag: 'Ma', rol: ROL_M,
          stappen: steps([X('Aanvraag gelezen', 'Request read'), 1], [X('Antwoord voorgesteld', 'Reply suggested'), 1], [X('Antwoord gecontroleerd', 'Reply checked'), 0], [X('Antwoord verstuurd', 'Reply sent'), 0]),
          ai: { naam: ASST[0], tekst: X('Bedankt voor je aanvraag. We hebben ze ontvangen en bekijken ze deze week. Past een gesprek op dinsdag of donderdag?', 'Thank you for your request. We have received it and will look at it this week. Would a call on Tuesday or Thursday suit you?'), verstuurd: false, bewerk: false, gecheckt: false },
          berichten: [{ van: KLANT('B'), klant: true, uit: 'klant', txt: X('Kunnen jullie meedenken over een koppeling tussen onze pakketten?', 'Can you help us think about an integration between our packages?'), t: EERDER }] },
        { id: 'D-1042', titel: X('Afspraak inplannen', 'Schedule appointment'), klant: KLANT('A'), soort: 'Afspraak', status: 'bezig', dag: 'Ma', rol: ROL_P,
          stappen: steps([X('Moment gekozen', 'Time chosen'), 1], [X('Bevestiging klaarzetten', 'Prepare confirmation'), 0], [X('Bevestiging versturen', 'Send confirmation'), 0]), ai: null, berichten: [] },
        { id: 'D-1043', titel: X('Wijziging goedkeuren', 'Approve change'), klant: KLANT('C'), soort: 'Wijziging', status: 'wacht', dag: 'Ma', rol: ROL_M,
          stappen: steps([X('Wijziging beschreven', 'Change described'), 1], [X('Voorstel gestuurd', 'Proposal sent'), 1], [X('Reactie ontvangen', 'Reply received'), 0]), ai: null,
          berichten: [{ van: TEAM, klant: true, uit: 'team', txt: X('We hebben het voorstel gestuurd. Laat je weten of het zo goed is?', 'We have sent the proposal. Can you let us know if it works for you?'), t: EERDER }] },
        { id: 'D-1044', titel: X('Klantbericht opvolgen', 'Follow up customer message'), klant: KLANT('B'), soort: 'Aanvraag', status: 'bezig', dag: 'Di', rol: ROL_M,
          stappen: steps([X('Bericht gelezen', 'Message read'), 1], [X('Antwoord voorgesteld', 'Reply suggested'), 1], [X('Antwoord gecontroleerd', 'Reply checked'), 0]),
          ai: { naam: ASST[0], tekst: X('Bedankt voor je bericht. We kijken ernaar en laten je morgen weten hoe we verder gaan.', 'Thank you for your message. We will look into it and let you know tomorrow how we will proceed.'), verstuurd: false, bewerk: false, gecheckt: false },
          berichten: [] },
        { id: 'D-1045', titel: X('Onderhoud inplannen', 'Schedule maintenance'), klant: KLANT('D'), soort: 'Onderhoud', status: 'nieuw', dag: 'Wo', rol: ROL_P,
          stappen: steps([X('Onderdelen nagekeken', 'Parts checked'), 0], [X('Moment afgesproken', 'Time agreed'), 0]), ai: null, berichten: [] },
        { id: 'D-1046', titel: X('Levering voorbereiden', 'Prepare delivery'), klant: KLANT('E'), soort: 'Levering', status: 'bezig', dag: 'Wo', rol: ROL_M,
          stappen: steps([X('Lijst nagekeken', 'List checked'), 1], [X('Planning gemaakt', 'Schedule made'), 1], [X('Klant verwittigd', 'Customer notified'), 0]), ai: null, berichten: [] },
        { id: 'D-1047', titel: X('Wijziging bespreken', 'Discuss change'), klant: KLANT('B'), soort: 'Wijziging', status: 'wacht', dag: 'Do', rol: ROL_M,
          stappen: steps([X('Vraag genoteerd', 'Question noted'), 1], [X('Voorstel gedaan', 'Proposal made'), 1], [X('Reactie van de klant', 'Reply from the customer'), 0]), ai: null,
          berichten: [{ van: TEAM, klant: true, uit: 'team', txt: X('We hebben twee opties uitgewerkt. Welke past het best bij jullie?', 'We have worked out two options. Which one suits you best?'), t: EERDER }] },
        { id: 'D-1048', titel: X('Rapport opstellen', 'Write report'), klant: KLANT('A'), soort: 'Rapport', status: 'bezig', dag: 'Do', rol: ROL_M,
          stappen: steps([X('Gegevens verzameld', 'Data collected'), 1], [X('Concept gemaakt', 'Draft made'), 0], [X('Concept gecontroleerd', 'Draft checked'), 0]),
          ai: { naam: ASST[2], tekst: X('Dit is een concept van het rapport met de gegevens van deze periode. Een mens leest het na voor het naar de klant gaat.', 'This is a draft of the report with the data for this period. A person reads it through before it goes to the customer.'), verstuurd: false, bewerk: false, gecheckt: false },
          berichten: [] },
        { id: 'D-1049', titel: X('Gegevens controleren', 'Check data'), klant: KLANT('C'), soort: 'Wijziging', status: 'klaar', dag: 'Vr', rol: ROL_M,
          stappen: steps([X('Gegevens nagekeken', 'Data checked'), 1], [X('Fouten verbeterd', 'Errors fixed'), 1]), ai: null, berichten: [] }
      ],
      log: [
        { t: EERDER, x: KLANT('B') + X(' stuurde een bericht bij D-1041', ' sent a message on D-1041') },
        { t: EERDER, x: X('Team stuurde een voorstel bij D-1043', 'Team sent a proposal on D-1043') },
        { t: EERDER, x: X('D-1049 is afgerond', 'D-1049 is finished') },
        { t: GISTEREN, x: X('Planning van de week bijgewerkt', 'Planning for the week updated') }
      ],
      koppel: [
        { id: 'boek', naam: X('Boekhoudpakket', 'Accounting package'), wat: X('Afgeronde dossiers gaan door voor facturatie.', 'Finished cases are passed on for invoicing.'), aan: true, bezig: false, sync: VANDAAG_T },
        { id: 'mail', naam: X('E-mailbox', 'Mailbox'), wat: X('Berichten van klanten komen als dossier binnen.', 'Messages from customers come in as a case.'), aan: true, bezig: false, sync: VANDAAG_T },
        { id: 'shop', naam: 'Webshop', wat: X('Bestellingen komen binnen als aanvraag.', 'Orders come in as a request.'), aan: false, bezig: false, sync: GISTEREN },
        { id: 'agenda', naam: X('Agenda', 'Calendar'), wat: X('Afspraken uit de planning komen in de agenda.', 'Appointments from the planning appear in the calendar.'), aan: true, bezig: false, sync: VANDAAG_T }
      ]
    };
  }
  var S = seed();
  var timers = {};

  var byId = function (id) { for (var i = 0; i < S.d.length; i++) if (S.d[i].id === id) return S.d[i]; return null; };
  var open = function () { return S.d.filter(function (d) { return d.status !== 'klaar'; }); };
  var concepten = function () { return S.d.filter(function (d) { return d.ai && !d.ai.verstuurd; }); };
  var addLog = function (x) { S.log.unshift({ t: NU, x: x }); if (S.log.length > 12) S.log.length = 12; };
  var draft = function (id) { return S.drafts[id] || (S.drafts[id] = { note: '', zicht: false, ai: null, reply: '' }); };

  /* ---------- meldingen ---------- */
  function toast(msg) {
    var t = $('#pf-toast');
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(timers.toast);
    timers.toast = setTimeout(function () { t.classList.remove('is-on'); }, 4200);
  }

  /* ---------- kop en zijbalk ---------- */
  function renderChrome() {
    root.setAttribute('data-mode', S.mode);
    var team = S.mode === 'team';
    $('#pf-bar').innerHTML =
      '<div class="pf-brand"><span class="mk-s" aria-hidden="true"></span><b>' + X('Voorbeeldbedrijf', 'Example company') + '</b><span class="pf-tag">' + X('Voorbeeld met verzonnen gegevens', 'Example with made-up data') + '</span></div>' +
      '<div class="pf-mode" role="group" aria-label="' + X('Kijk als', 'View as') + '">' +
      '<button type="button" data-act="mode" data-m="team" aria-pressed="' + team + '">Team</button>' +
      '<button type="button" data-act="mode" data-m="klant" aria-pressed="' + !team + '">' + X('Klantportaal', 'Customer portal') + '</button></div>' +
      '<div class="pf-acts">' +
      (team ? '<button type="button" class="pf-btn pf-btn--a" data-act="new">' + ic('plus') + '<span>' + X('Nieuw dossier', 'New case') + '</span><kbd>N</kbd></button>' : '<button type="button" class="pf-btn pf-btn--a" data-act="new">' + ic('plus') + '<span>' + X('Nieuwe aanvraag', 'New request') + '</span></button>') +
      '<button type="button" class="pf-btn" data-act="reset" title="' + X('Zet de voorbeeldgegevens terug', 'Reset the example data') + '">' + ic('reset') + '<span>' + X('Zet terug', 'Reset') + '</span></button></div>';
    var badge = { dossiers: open().length, assistent: concepten().length };
    $('#pf-side').innerHTML = '<ul>' + VIEWS.map(function (v) {
      var on = S.view === v[0];
      var n = badge[v[0]];
      return '<li><button type="button" data-act="nav" data-v="' + v[0] + '"' + (on ? ' aria-current="page"' : '') + '>' + ic(v[0]) + '<span>' + v[1] + '</span>' + (n ? '<i class="pf-n">' + n + '<span class="vh">' + (v[0] === 'assistent' ? X(' te controleren', ' to check') : X(' open', ' open')) + '</span></i>' : '') + '</button></li>';
    }).join('') + '</ul>';
  }

  /* ---------- hoofdvensters ---------- */
  function renderMain() {
    var m = $('#pf-main');
    var top = m.scrollTop;
    var html;
    if (S.mode === 'klant') html = viewPortaal();
    else if (S.view === 'overzicht') html = viewOverzicht();
    else if (S.view === 'dossiers') html = viewDossiers();
    else if (S.view === 'planning') html = viewPlanning();
    else if (S.view === 'assistent') html = viewAssistent();
    else html = viewKoppelingen();
    m.innerHTML = html;
    m.scrollTop = top;
    if (S.mode === 'team' && S.view === 'dossiers') renderRows();
    if (S.view === 'assistent' && S.mode === 'team') { var l = $('.pf-chatlog'); if (l) l.scrollTop = l.scrollHeight; }
  }

  function badge(s) { return '<span class="bd bd--' + s + '">' + st(STATUS_S[s]) + h(STATUS_L[s]) + '</span>'; }

  function viewOverzicht() {
    var vandaag = open().filter(function (d) { return d.dag === VANDAAG; });
    var tiles = [
      [X('Open dossiers', 'Open cases'), open().length, 'dossiers', 'open'],
      [X('Wachten op klant', 'Waiting for customer'), S.d.filter(function (d) { return d.status === 'wacht'; }).length, 'dossiers', 'wacht'],
      [X('Vandaag gepland', 'Planned today'), vandaag.length, 'planning', ''],
      [X('Concepten te controleren', 'Drafts to check'), concepten().length, 'assistent', '']
    ];
    return '<div class="pf-head"><h2 class="pf-h">' + X('Overzicht', 'Overview') + '</h2><span class="pf-sub">' + X('Wat er nu speelt in de voorbeeldgegevens', 'What is going on in the example data') + '</span></div>' +
      '<ul class="pf-tiles">' + tiles.map(function (t) {
        return '<li><button type="button" data-act="tile" data-v="' + t[2] + '" data-f="' + t[3] + '"><span class="pf-tn">' + t[1] + '</span><span class="pf-tl">' + t[0] + '</span></button></li>';
      }).join('') + '</ul>' +
      '<div class="pf-two"><section aria-labelledby="pf-vd"><h3 class="pf-h2" id="pf-vd">' + X('Vandaag (maandag)', 'Today (Monday)') + '</h3>' +
      (vandaag.length ? '<ul class="pf-list">' + vandaag.map(function (d) {
        return '<li><button type="button" class="pf-li" data-act="open" data-id="' + d.id + '" data-fk="o-' + d.id + '">' + st(STATUS_S[d.status]) + '<span class="pf-lt">' + h(d.titel) + '</span><span class="pf-lk">' + h(d.klant) + '</span></button></li>';
      }).join('') + '</ul>' : '<p class="pf-empty">' + X('Niets meer voor vandaag.', 'Nothing left for today.') + '</p>') + '</section>' +
      '<section aria-labelledby="pf-ac"><h3 class="pf-h2" id="pf-ac">' + X('Activiteit', 'Activity') + '</h3><ol class="pf-log">' + S.log.slice(0, 7).map(function (l) {
        return '<li><span class="pf-lw">' + h(l.t) + '</span><span>' + h(l.x) + '</span></li>';
      }).join('') + '</ol></section></div>';
  }

  var FILTERS = [['alle', X('Alle', 'All')], ['open', 'Open'], ['nieuw', STATUS_L.nieuw], ['bezig', STATUS_L.bezig], ['wacht', STATUS_L.wacht], ['klaar', STATUS_L.klaar]];
  function viewDossiers() {
    var cols = [['id', X('Dossier', 'Case')], ['titel', X('Titel', 'Title')], ['klant', X('Klant', 'Customer')], ['soort', X('Soort', 'Type')], ['status', 'Status'], ['dag', X('Dag', 'Day')]];
    return '<div class="pf-head"><h2 class="pf-h">' + X('Dossiers', 'Cases') + '</h2><span class="pf-sub" id="pf-count" aria-live="polite"></span></div>' +
      '<div class="pf-tools"><div class="pf-chips" role="group" aria-label="' + X('Filter op status', 'Filter by status') + '">' + FILTERS.map(function (f) {
        return '<button type="button" class="pf-chip" data-act="filter" data-f="' + f[0] + '" aria-pressed="' + (S.filter === f[0]) + '">' + f[1] + '</button>';
      }).join('') + '</div>' +
      '<label class="pf-search" for="pf-q">' + '<span class="vh">' + X('Zoek in dossiers', 'Search cases') + '</span><input type="search" id="pf-q" placeholder="' + X('Zoek in dossiers', 'Search cases') + '" value="' + h(S.q) + '" autocomplete="off" spellcheck="false"></label></div>' +
      '<div class="pf-tw"><table class="pf-t"><thead><tr>' + cols.map(function (c) {
        var on = S.sort.k === c[0];
        return '<th scope="col" class="c-' + c[0] + '"' + (on ? ' aria-sort="' + (S.sort.dir > 0 ? 'ascending' : 'descending') + '"' : '') + '><button type="button" data-act="sort" data-s="' + c[0] + '">' + c[1] + '<i aria-hidden="true">' + (on ? (S.sort.dir > 0 ? '↑' : '↓') : '') + '</i></button></th>';
      }).join('') + '</tr></thead><tbody id="pf-rows"></tbody></table></div>';
  }

  function sortVal(d, k) {
    if (k === 'status') return STATUS.map(function (s) { return s[0]; }).indexOf(d.status);
    if (k === 'dag') return DAGEN.indexOf(d.dag);
    if (k === 'soort') return SOORT_L[d.soort].toLowerCase();
    return String(d[k]).toLowerCase();
  }
  function list() {
    var q = S.q.trim().toLowerCase();
    var r = S.d.filter(function (d) {
      if (S.filter === 'open' ? d.status === 'klaar' : S.filter !== 'alle' && d.status !== S.filter) return false;
      if (!q) return true;
      return (d.id + ' ' + d.titel + ' ' + d.klant + ' ' + SOORT_L[d.soort] + ' ' + STATUS_L[d.status] + ' ' + DAG_L[d.dag]).toLowerCase().indexOf(q) > -1;
    });
    r.sort(function (a, b) {
      var x = sortVal(a, S.sort.k), y = sortVal(b, S.sort.k);
      var c = x < y ? -1 : x > y ? 1 : 0;
      return (c || (a.id < b.id ? -1 : 1)) * S.sort.dir;
    });
    return r;
  }
  function renderRows() {
    var body = $('#pf-rows');
    if (!body) return;
    var r = list();
    body.innerHTML = r.length ? r.map(function (d) {
      return '<tr data-id="' + d.id + '"' + (S.sel === d.id ? ' class="is-sel"' : '') + '>' +
        '<td class="c-id">' + d.id + '</td>' +
        '<td class="c-titel"><button type="button" class="pf-rowbtn" data-act="open" data-id="' + d.id + '" data-fk="o-' + d.id + '">' + h(d.titel) + '</button></td>' +
        '<td class="c-klant">' + h(d.klant) + '</td><td class="c-soort">' + h(SOORT_L[d.soort]) + '</td>' +
        '<td class="c-status">' + badge(d.status) + '</td><td class="c-dag">' + DAG_S[d.dag] + '</td></tr>';
    }).join('') : '<tr class="pf-none"><td colspan="6">' + X('Geen dossiers gevonden. Wis de zoekterm of kies Alle.', 'No cases found. Clear the search or choose All.') + '</td></tr>';
    var c = $('#pf-count');
    if (c) c.textContent = r.length + X(' van ', ' of ') + S.d.length + X(' dossiers', ' cases');
  }

  function viewPlanning() {
    return '<div class="pf-head"><h2 class="pf-h">Planning</h2><span class="pf-sub">' + X('Deze week · schuif een dossier met de pijltjes naar een andere dag', 'This week · move a case to another day with the arrows') + '</span></div>' +
      '<div class="pf-week">' + DAGEN.map(function (dg, di) {
        var items = S.d.filter(function (d) { return d.dag === dg; });
        return '<section class="pf-day' + (dg === VANDAAG ? ' is-today' : '') + '" aria-labelledby="pf-dh-' + dg + '"><h3 id="pf-dh-' + dg + '"><span>' + DAG_S[dg] + '</span>' + (dg === VANDAAG ? '<i>' + VANDAAG_T + '</i>' : '') + '</h3>' +
          (items.length ? '<ul>' + items.map(function (d) {
            return '<li class="pf-pc st-' + d.status + '"><button type="button" class="pf-pb" data-act="open" data-id="' + d.id + '" data-fk="o-' + d.id + '">' + st(STATUS_S[d.status]) + '<span class="pf-pt">' + h(d.titel) + '</span><span class="pf-pk">' + h(d.klant) + ' · ' + h(STATUS_L[d.status]) + '</span></button>' +
              '<span class="pf-mv"><button type="button" data-act="shift" data-id="' + d.id + '" data-dir="-1" data-fk="s-' + d.id + '-1" aria-label="' + h(X('Verplaats ' + d.titel + ' (' + d.id + ') een dag eerder', 'Move ' + d.titel + ' (' + d.id + ') one day earlier')) + '"' + (di === 0 ? ' disabled' : '') + '>' + ic('left') + '</button>' +
              '<button type="button" data-act="shift" data-id="' + d.id + '" data-dir="1" data-fk="s-' + d.id + '1" aria-label="' + h(X('Verplaats ' + d.titel + ' (' + d.id + ') een dag later', 'Move ' + d.titel + ' (' + d.id + ') one day later')) + '"' + (di === DAGEN.length - 1 ? ' disabled' : '') + '>' + ic('right') + '</button></span></li>';
          }).join('') + '</ul>' : '<p class="pf-empty">' + X('Vrij', 'Free') + '</p>') + '</section>';
      }).join('') + '</div>';
  }

  /* ---------- assistent ---------- */
  function answer(q) {
    var t = q.toLowerCase();
    var lijst = function (arr) { return arr.map(function (d) { return d.id + ' (' + d.titel.toLowerCase() + ')'; }).join(', '); };
    var vd = open().filter(function (d) { return d.dag === VANDAAG; });
    var wacht = S.d.filter(function (d) { return d.status === 'wacht'; });
    var con = concepten();
    var re = EN
      ? { dag: /today|planned|planning|schedule/, wacht: /wait|customer/, con: /check|draft|review|ai/, open: /open|how many|number|cases/ }
      : { dag: /vandaag|gepland|planning/, wacht: /wacht|klant/, con: /controle|concept|check|ai/, open: /open|hoeveel|aantal|dossiers/ };
    if (re.dag.test(t)) return vd.length ? X('Vandaag (' + DAG_L[VANDAAG] + ') staan ' + vd.length + ' open dossiers gepland: ' + lijst(vd) + '.', 'Today (' + DAG_L[VANDAAG] + ') ' + vd.length + ' open cases are planned: ' + lijst(vd) + '.') : X('Vandaag staat er niets open.', 'Nothing is open today.');
    if (re.wacht.test(t)) return wacht.length ? X(wacht.length + ' dossiers wachten op een reactie van de klant: ' + lijst(wacht) + '.', wacht.length + ' cases are waiting for a reply from the customer: ' + lijst(wacht) + '.') : X('Er wacht geen enkel dossier op een klant.', 'No case is waiting for a customer.');
    if (re.con.test(t)) return con.length ? X(con.length + ' concepten wachten op controle door een mens: ' + lijst(con) + '. Er wordt niets verstuurd voor iemand ze heeft nagekeken.', con.length + ' drafts are waiting to be checked by a person: ' + lijst(con) + '. Nothing is sent before someone has checked it.') : X('Er zijn geen concepten die op controle wachten.', 'There are no drafts waiting to be checked.');
    if (re.open.test(t)) return X('Er zijn ' + open().length + ' open dossiers en ' + (S.d.length - open().length) + ' afgeronde.', 'There are ' + open().length + ' open cases and ' + (S.d.length - open().length) + ' finished.');
    return X('Dat kan ik in dit voorbeeld niet beantwoorden. Probeer een van de vragen hierboven.', 'I cannot answer that in this example. Try one of the questions above.');
  }
  function viewAssistent() {
    var on = S.asstOn[S.asstSel];
    var con = concepten();
    var chat = S.chat.length ? S.chat.map(function (m) { return '<p class="pf-m pf-m--' + m.r + '">' + h(m.x) + '</p>'; }).join('') : '<p class="pf-empty">' + X('Stel een vraag, of kies er een hieronder.', 'Ask a question, or pick one below.') + '</p>';
    var QS = [[X('Wat staat er vandaag gepland?', 'What is planned today?')], [X('Welke dossiers wachten op de klant?', 'Which cases are waiting for the customer?')], [X('Welke concepten moet ik nakijken?', 'Which drafts do I need to check?')]];
    return '<div class="pf-head"><h2 class="pf-h">' + X('Assistent', 'Assistant') + '</h2><span class="pf-sub">' + X('Antwoorden komen uit de voorbeeldgegevens in dit venster', 'Answers come from the example data in this window') + '</span></div>' +
      '<div class="pf-two pf-two--a"><section aria-labelledby="pf-as"><h3 class="pf-h2" id="pf-as">' + X('Assistenten', 'Assistants') + '</h3><ul class="pf-asl">' + ASST.map(function (n, i) {
        return '<li class="' + (i === S.asstSel ? 'is-sel' : '') + '"><button type="button" class="pf-asb" data-act="asst-pick" data-i="' + i + '" aria-pressed="' + (i === S.asstSel) + '"><span class="pf-an">' + h(n) + '</span><span class="pf-as2">' + (S.asstOn[i] ? X('Staat aan', 'Is on') : X('Staat uit', 'Is off')) + '</span></button>' +
          '<button type="button" class="pf-sw" role="switch" data-act="asst-toggle" data-i="' + i + '" aria-checked="' + S.asstOn[i] + '" aria-label="' + h(n) + X(' aan of uit', ' on or off') + '"><i></i></button></li>';
      }).join('') + '</ul>' +
      '<h3 class="pf-h2">' + X('Wachten op controle', 'Waiting to be checked') + '</h3>' + (con.length ? '<ul class="pf-list">' + con.map(function (d) {
        return '<li><button type="button" class="pf-li" data-act="open" data-id="' + d.id + '" data-fk="o-' + d.id + '">' + st('draft') + '<span class="pf-lt">' + h(d.titel) + '</span><span class="pf-lk">' + d.id + '</span></button></li>';
      }).join('') + '</ul>' : '<p class="pf-empty">' + X('Alle concepten zijn nagekeken.', 'All drafts have been checked.') + '</p>') + '</section>' +
      '<section class="pf-chat" aria-labelledby="pf-cs"><h3 class="pf-h2" id="pf-cs">' + h(ASST[S.asstSel]) + '</h3><p class="pf-ai"><span class="ai-c">' + X('Je gebruikt een AI-assistent', 'You are using an AI assistant') + '</span></p>' +
      '<div class="pf-chatlog" role="log" aria-live="polite" aria-label="' + h(X('Gesprek met ', 'Conversation with ') + ASST[S.asstSel]) + '">' + chat + '</div>' +
      '<div class="pf-chips" role="group" aria-label="' + X('Voorbeeldvragen', 'Example questions') + '">' + QS.map(function (q) {
        return '<button type="button" class="pf-chip" data-act="ask" data-q="' + h(q[0]) + '"' + (on ? '' : ' disabled') + '>' + q[0] + '</button>';
      }).join('') + '</div>' +
      '<form class="pf-ask" data-form="ask"><label class="vh" for="pf-askq">' + h(X('Stel een vraag aan ', 'Ask a question to ') + ASST[S.asstSel]) + '</label><input id="pf-askq" type="text" placeholder="' + (on ? X('Stel een vraag', 'Ask a question') : X('Zet de assistent aan om te vragen', 'Turn the assistant on to ask')) + '" value="' + h(S.chatDraft) + '"' + (on ? '' : ' disabled') + ' autocomplete="off"><button type="submit" class="pf-btn pf-btn--a"' + (on ? '' : ' disabled') + '>' + ic('send') + '<span>' + X('Vraag', 'Ask') + '</span></button></form>' +
      '<p class="pf-fine">' + X('Een mens controleert wat naar een klant gaat.', 'A person checks what goes to a customer.') + '</p></section></div>';
  }

  /* ---------- koppelingen ---------- */
  function viewKoppelingen() {
    return '<div class="pf-head"><h2 class="pf-h">' + X('Koppelingen', 'Integrations') + '</h2><span class="pf-sub">' + X('Het platform praat met de pakketten die je al gebruikt', 'The platform talks to the packages you already use') + '</span></div>' +
      '<ul class="pf-kl">' + S.koppel.map(function (k, i) {
        var stt = k.bezig ? X('Bezig met synchroniseren', 'Synchronising') : k.aan ? X('Verbonden', 'Connected') : X('Gepauzeerd', 'Paused');
        return '<li class="pf-k' + (k.aan ? '' : ' is-off') + '"><div class="pf-kb"><h3>' + h(k.naam) + '</h3><p>' + h(k.wat) + '</p><p class="pf-ks">' + st(k.bezig ? 'prog' : k.aan ? 'done' : 'todo') + '<span>' + stt + '</span><span class="pf-kt">' + X('Laatst: ', 'Last: ') + h(k.sync) + '</span></p></div>' +
          '<div class="pf-ka"><button type="button" class="pf-btn" data-act="sync" data-i="' + i + '"' + (!k.aan || k.bezig ? ' disabled' : '') + '>' + X('Nu synchroniseren', 'Synchronise now') + '</button>' +
          '<button type="button" class="pf-btn" data-act="koppel-toggle" data-i="' + i + '" aria-pressed="' + !k.aan + '">' + (k.aan ? X('Pauzeer', 'Pause') : X('Hervat', 'Resume')) + '</button></div></li>';
      }).join('') + '</ul><p class="pf-fine">' + X('In dit voorbeeld gaat er niets echt door. Zo toont het hoe een koppeling in beeld komt.', 'In this example nothing is really passed on. It only shows how an integration appears on screen.') + '</p>';
  }

  /* ---------- klantportaal ---------- */
  var STAPPEN_P = [X('Ontvangen', 'Received'), X('In behandeling', 'In progress'), X('Klaar', 'Done')];
  function portaalStap(s) { return s === 'nieuw' ? 0 : s === 'klaar' ? 2 : 1; }
  function viewPortaal() {
    var mine = S.d.filter(function (d) { return d.klant === PORTAAL_KLANT; });
    return '<div class="pf-head"><h2 class="pf-h">' + X('Jouw dossiers', 'Your cases') + '</h2><span class="pf-sub">' + X('Zo ziet ' + PORTAAL_KLANT + ' het · dezelfde gegevens als het team', 'This is what ' + PORTAAL_KLANT + ' sees · the same data as the team') + '</span></div>' +
      (mine.length ? '<ul class="pf-pl">' + mine.map(function (d) {
        var cur = portaalStap(d.status);
        var msgs = d.berichten.filter(function (b) { return b.klant; });
        var dr = draft(d.id);
        return '<li class="pf-pd" id="pf-p-' + d.id + '"><div class="pf-pdh"><h3>' + h(d.titel) + '</h3><span class="pf-ref">' + d.id + '</span></div>' +
          '<ol class="pf-steps" aria-label="' + h(X('Voortgang van ', 'Progress of ') + d.titel) + '">' + STAPPEN_P.map(function (s, i) {
            return '<li class="' + (i < cur || d.status === 'klaar' ? 'is-done' : i === cur ? 'is-cur' : '') + '"' + (i === cur ? ' aria-current="step"' : '') + '>' + st(i < cur || d.status === 'klaar' ? 'done' : i === cur ? 'prog' : 'todo') + '<span>' + s + '</span></li>';
          }).join('') + '</ol>' +
          (d.status === 'wacht' ? '<p class="pf-wait">' + X('We wachten op jouw reactie.', 'We are waiting for your reply.') + '</p>' : '') +
          '<div class="pf-msgs">' + (msgs.length ? msgs.map(function (b) { return '<p class="pf-b pf-b--' + b.uit + '"><span class="pf-bw">' + h(b.van) + ' · ' + h(b.t) + '</span>' + h(b.txt) + '</p>'; }).join('') : '<p class="pf-empty">' + X('Nog geen berichten.', 'No messages yet.') + '</p>') + '</div>' +
          (d.status === 'klaar' ? '' : '<form class="pf-reply" data-form="reply" data-id="' + d.id + '"><label for="pf-r-' + d.id + '">' + (d.status === 'wacht' ? X('Jouw reactie', 'Your reply') : X('Stel een vraag', 'Ask a question')) + '</label><textarea id="pf-r-' + d.id + '" rows="2" data-draft="reply" data-id="' + d.id + '">' + h(dr.reply) + '</textarea><button type="submit" class="pf-btn pf-btn--a">' + ic('send') + '<span>' + X('Verstuur', 'Send') + '</span></button></form>') + '</li>';
      }).join('') + '</ul>' : '<p class="pf-empty">' + X('Je hebt nog geen dossiers.', 'You have no cases yet.') + '</p>');
  }

  /* ---------- detail van een dossier ---------- */
  function detailHTML(d) {
    var dr = draft(d.id);
    var done = d.stappen.filter(function (s) { return s.done; }).length;
    var pct = d.stappen.length ? Math.round(100 * done / d.stappen.length) : 0;
    var ai = '';
    if (d.ai) {
      var txt = dr.ai === null ? d.ai.tekst : dr.ai;
      var AIL = X('Je gebruikt een AI-assistent', 'You are using an AI assistant');
      if (d.ai.verstuurd) {
        ai = '<section class="pf-aib is-sent" aria-labelledby="pf-aih"><h4 class="pf-h2" id="pf-aih">' + X('Antwoord', 'Reply') + '</h4><p class="pf-ai"><span class="ai-c">' + AIL + '</span><span class="pf-an2">' + h(d.ai.naam) + '</span></p><p class="pf-q">' + h(txt) + '</p><p class="pf-sent">' + st('done') + '<span>' + X('Gecontroleerd door een mens en verstuurd', 'Checked by a person and sent') + '</span></p></section>';
      } else {
        ai = '<section class="pf-aib" aria-labelledby="pf-aih"><h4 class="pf-h2" id="pf-aih">' + X('Antwoord voor de klant', 'Reply for the customer') + '</h4><p class="pf-ai"><span class="ai-c">' + AIL + '</span><span class="pf-an2">' + h(d.ai.naam) + X(' stelt dit voor', ' suggests this') + '</span></p>' +
          '<label class="vh" for="pf-aitxt">' + X('Voorgesteld antwoord', 'Suggested reply') + '</label><textarea id="pf-aitxt" rows="4" data-draft="ai" data-id="' + d.id + '"' + (d.ai.bewerk ? '' : ' readonly') + '>' + h(txt) + '</textarea>' +
          '<div class="pf-aia"><button type="button" class="pf-btn" data-act="ai-edit" data-id="' + d.id + '" aria-pressed="' + d.ai.bewerk + '">' + (d.ai.bewerk ? X('Klaar met aanpassen', 'Done editing') : X('Pas aan', 'Edit')) + '</button>' +
          '<label class="pf-ck" for="pf-aic"><input type="checkbox" id="pf-aic" data-act="ai-check" data-id="' + d.id + '"' + (d.ai.gecheckt ? ' checked' : '') + '><span class="pf-box" aria-hidden="true">' + (d.ai.gecheckt ? '<svg viewBox="0 0 14 14"><path d="' + IC.check + '"/></svg>' : '') + '</span><span>' + X('Gecontroleerd door een mens', 'Checked by a person') + '</span></label>' +
          '<button type="button" class="pf-btn pf-btn--a" data-act="ai-send" data-id="' + d.id + '"' + (d.ai.gecheckt ? '' : ' disabled') + '>' + ic('send') + '<span>' + X('Verstuur naar de klant', 'Send to the customer') + '</span></button></div>' +
          (d.ai.gecheckt ? '' : '<p class="pf-fine">' + X('Verzenden kan pas nadat een mens het antwoord heeft gecontroleerd.', 'Sending is only possible after a person has checked the reply.') + '</p>') + '</section>';
      }
    }
    var msgs = d.berichten.length ? '<ul class="pf-bl">' + d.berichten.map(function (b) {
      return '<li class="pf-b pf-b--' + b.uit + '"><span class="pf-bw">' + h(b.van) + ' · ' + h(b.t) + (b.uit === 'intern' ? X(' · alleen intern', ' · internal only') : '') + '</span>' + h(b.txt) + '</li>';
    }).join('') + '</ul>' : '<p class="pf-empty">' + X('Nog geen berichten.', 'No messages yet.') + '</p>';
    return '<div class="pf-dh"><button type="button" class="pf-back" data-act="close" aria-label="' + X('Terug naar de lijst', 'Back to the list') + '">' + ic('back') + '<span>' + X('Terug', 'Back') + '</span></button><span class="pf-ref">' + d.id + '</span>' + badge(d.status) + '<span class="sp"></span><button type="button" class="pf-x" data-act="close" aria-label="' + X('Sluit dossier ', 'Close case ') + d.id + '">' + ic('close') + '<kbd>Esc</kbd></button></div>' +
      '<div class="pf-db"><h3 class="pf-dt" id="pf-dt" tabindex="-1">' + h(d.titel) + '</h3>' +
      '<dl class="pf-props"><div><dt>' + X('Klant', 'Customer') + '</dt><dd>' + h(d.klant) + '</dd></div><div><dt>' + X('Soort', 'Type') + '</dt><dd>' + h(SOORT_L[d.soort]) + '</dd></div><div><dt>' + X('Verantwoordelijke', 'Responsible') + '</dt><dd>' + h(d.rol) + '</dd></div>' +
      '<div><dt><label for="pf-st">Status</label></dt><dd><select id="pf-st" data-act="status" data-id="' + d.id + '">' + STATUS.map(function (s) { return '<option value="' + s[0] + '"' + (d.status === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></dd></div>' +
      '<div><dt><label for="pf-dg">' + X('Dag', 'Day') + '</label></dt><dd><select id="pf-dg" data-act="dag" data-id="' + d.id + '">' + DAGEN.map(function (x) { return '<option value="' + x + '"' + (d.dag === x ? ' selected' : '') + '>' + DAG_S[x] + ' (' + DAG_L[x] + ')</option>'; }).join('') + '</select></dd></div></dl>' +
      '<section aria-labelledby="pf-sh"><h4 class="pf-h2" id="pf-sh">' + X('Stappen', 'Steps') + ' <span class="pf-cnt">' + done + X(' van ', ' of ') + d.stappen.length + '</span></h4><div class="pf-prog" role="progressbar" aria-label="' + X('Voortgang', 'Progress') + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><i style="width:' + pct + '%"></i></div>' +
      '<ul class="pf-steps2">' + d.stappen.map(function (s, i) {
        return '<li><label class="pf-ck" for="pf-s-' + i + '"><input type="checkbox" id="pf-s-' + i + '" data-act="step" data-id="' + d.id + '" data-i="' + i + '"' + (s.done ? ' checked' : '') + '><span class="pf-box" aria-hidden="true">' + (s.done ? '<svg viewBox="0 0 14 14"><path d="' + IC.check + '"/></svg>' : '') + '</span><span>' + h(s.t) + '</span></label></li>';
      }).join('') + '</ul></section>' + ai +
      '<section aria-labelledby="pf-bh"><h4 class="pf-h2" id="pf-bh">' + X('Berichten', 'Messages') + '</h4>' + msgs +
      '<form class="pf-note" data-form="note" data-id="' + d.id + '"><label for="pf-nt">' + X('Notitie of bericht', 'Note or message') + '</label><textarea id="pf-nt" rows="2" data-draft="note" data-id="' + d.id + '">' + h(dr.note) + '</textarea>' +
      '<div class="pf-na"><label class="pf-ck" for="pf-zv"><input type="checkbox" id="pf-zv" data-draft="zicht" data-id="' + d.id + '"' + (dr.zicht ? ' checked' : '') + '><span class="pf-box" aria-hidden="true">' + (dr.zicht ? '<svg viewBox="0 0 14 14"><path d="' + IC.check + '"/></svg>' : '') + '</span><span>' + X('Zichtbaar voor de klant', 'Visible to the customer') + '</span></label><button type="submit" class="pf-btn">' + X('Toevoegen', 'Add') + '</button></div></form></section></div>';
  }
  function renderDetail(focusTitle) {
    var el = $('#pf-detail');
    var d = S.sel && S.mode === 'team' ? byId(S.sel) : null;
    if (!d) { el.hidden = true; el.innerHTML = ''; root.classList.remove('has-detail'); return; }
    var scroll = $('.pf-db', el) ? $('.pf-db', el).scrollTop : 0;
    el.innerHTML = detailHTML(d);
    el.hidden = false;
    root.classList.add('has-detail');
    el.setAttribute('aria-label', X('Dossier ', 'Case ') + d.id + ': ' + d.titel);
    var db = $('.pf-db', el);
    if (db) db.scrollTop = scroll;
    if (focusTitle) { var t = $('#pf-dt'); if (t) t.focus({ preventScroll: true }); }
  }

  /* ---------- dialoog: nieuw dossier of nieuwe aanvraag ---------- */
  var dlg = $('#pf-dlg');
  function openNew() {
    var team = S.mode === 'team';
    var sel = function (id, label, opts) { return '<div class="pf-f"><label for="' + id + '">' + label + '</label><select id="' + id + '">' + opts.map(function (o) { return '<option value="' + h(o[0]) + '">' + h(o[1]) + '</option>'; }).join('') + '</select></div>'; };
    dlg.innerHTML = '<form method="dialog" class="pf-nf" novalidate><h3 id="pf-nh">' + (team ? X('Nieuw dossier', 'New case') : X('Nieuwe aanvraag', 'New request')) + '</h3>' +
      '<div class="pf-f"><label for="pf-nti">' + (team ? X('Titel', 'Title') : X('Waarmee kunnen we helpen?', 'What can we help with?')) + '</label><input id="pf-nti" type="text" maxlength="60" autocomplete="off" aria-describedby="pf-ne"><p class="pf-err" id="pf-ne" role="alert" hidden>' + (team ? X('Geef het dossier een titel.', 'Give the case a title.') : X('Vertel kort waarmee we kunnen helpen.', 'Tell us briefly what we can help with.')) + '</p></div>' +
      (team ? sel('pf-nk', X('Klant', 'Customer'), KLANTEN.map(function (k) { return [k, k]; })) + sel('pf-ns', X('Soort', 'Type'), SOORTEN.map(function (s) { return [s, SOORT_L[s]]; })) + sel('pf-nd', X('Dag', 'Day'), DAGEN.map(function (g) { return [g, DAG_S[g]]; })) : '') +
      '<div class="pf-na"><button type="button" class="pf-btn" data-act="new-cancel">' + X('Annuleer', 'Cancel') + '</button><button type="submit" class="pf-btn pf-btn--a">' + (team ? X('Toevoegen', 'Add') : X('Verstuur', 'Send')) + '</button></div></form>';
    dlg.setAttribute('aria-labelledby', 'pf-nh');
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    $('#pf-nti', dlg).focus();
  }
  function closeNew() { if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open'); }
  function submitNew() {
    var inp = $('#pf-nti', dlg), err = $('#pf-ne', dlg);
    var titel = inp.value.trim();
    if (!titel) { err.hidden = false; inp.setAttribute('aria-invalid', 'true'); inp.focus(); return; }
    var team = S.mode === 'team';
    var id = 'D-' + (S.seq++);
    var d = {
      id: id, titel: titel, klant: team ? $('#pf-nk', dlg).value : PORTAAL_KLANT, soort: team ? $('#pf-ns', dlg).value : 'Aanvraag', status: 'nieuw', dag: team ? $('#pf-nd', dlg).value : 'Di', rol: ROL_M,
      stappen: [{ t: X('Gelezen', 'Read'), done: false }, { t: X('Opgepakt', 'Picked up'), done: false }], ai: null, berichten: []
    };
    S.d.push(d);
    addLog(team ? X('Nieuw dossier ', 'New case ') + id : d.klant + X(' deed een nieuwe aanvraag: ', ' made a new request: ') + id);
    closeNew();
    if (team) { S.view = 'dossiers'; S.filter = 'alle'; S.q = ''; S.sel = id; renderAll(true); toast(X('Dossier ' + id + ' is toegevoegd.', 'Case ' + id + ' has been added.')); }
    else { renderAll(); toast(X('Je aanvraag is verstuurd. Het team ziet ze als ' + id + '.', 'Your request has been sent. The team sees it as ' + id + '.')); }
  }

  /* ---------- tekenen ---------- */
  function renderAll(focusTitle) {
    renderChrome();
    renderMain();
    renderDetail(focusTitle);
    restoreFocus();
  }
  function restoreFocus() {
    if (!S.focusKey) return;
    var n = root.querySelector('[data-fk="' + S.focusKey + '"]');
    if (!n || n.disabled) n = S.focusAlt ? root.querySelector('[data-fk="' + S.focusAlt + '"]') : null;
    S.focusKey = null; S.focusAlt = null;
    if (n && !n.disabled) n.focus({ preventScroll: true });
  }
  function refresh() {
    renderChrome();
    renderMain();
    renderDetail(false);
    restoreFocus();
  }

  function selectDossier(id) {
    S.sel = id;
    refresh();
    renderDetail(true);
  }
  function closeDetail() {
    var id = S.sel;
    S.sel = null;
    S.focusKey = id ? 'o-' + id : null;
    refresh();
  }

  /* ---------- acties ---------- */
  function act(el, ev) {
    var a = el.getAttribute('data-act');
    var id = el.getAttribute('data-id');
    var d = id ? byId(id) : null;
    switch (a) {
      case 'nav': S.view = el.getAttribute('data-v'); S.sel = null; S.mode = 'team'; refresh(); $('#pf-main').focus({ preventScroll: true }); break;
      case 'mode': S.mode = el.getAttribute('data-m'); S.sel = null; refresh(); break;
      case 'tile': S.view = el.getAttribute('data-v'); if (el.getAttribute('data-f')) { S.filter = el.getAttribute('data-f'); S.q = ''; } S.sel = null; refresh(); $('#pf-main').focus({ preventScroll: true }); break;
      case 'open': if (d) selectDossier(id); break;
      case 'close': closeDetail(); break;
      case 'filter': S.filter = el.getAttribute('data-f'); $$('.pf-chip', $('#pf-main')).forEach(function (c) { c.setAttribute('aria-pressed', String(c === el)); }); renderRows(); break;
      case 'sort': var k = el.getAttribute('data-s'); S.sort = { k: k, dir: S.sort.k === k ? -S.sort.dir : 1 }; renderMain(); var sb = root.querySelector('[data-s="' + k + '"]'); if (sb) sb.focus({ preventScroll: true }); break;
      case 'shift': if (d) { var i = DAGEN.indexOf(d.dag) + parseInt(el.getAttribute('data-dir'), 10); if (i >= 0 && i < DAGEN.length) { d.dag = DAGEN[i]; addLog(X('Dossier ' + d.id + ' staat nu op ' + DAG_L[d.dag], 'Case ' + d.id + ' is now on ' + DAG_L[d.dag])); S.focusKey = 's-' + d.id + el.getAttribute('data-dir'); S.focusAlt = 'o-' + d.id; refresh(); renderDetail(false); toast(X(d.id + ' verplaatst naar ' + DAG_L[d.dag] + '.', d.id + ' moved to ' + DAG_L[d.dag] + '.')); } } break;
      case 'status': if (d) { d.status = el.value; addLog(X('Dossier ' + d.id + ' staat nu op ' + STATUS_L[d.status].toLowerCase(), 'Case ' + d.id + ' is now ' + STATUS_L[d.status].toLowerCase())); S.focusKey = null; renderChrome(); renderMain(); var det = $('#pf-detail'); var badgeEl = $('.bd', det); if (badgeEl) badgeEl.outerHTML = badge(d.status); toast(d.id + ': ' + STATUS_L[d.status] + '.'); } break;
      case 'dag': if (d) { d.dag = el.value; addLog(X('Dossier ' + d.id + ' staat nu op ' + DAG_L[d.dag], 'Case ' + d.id + ' is now on ' + DAG_L[d.dag])); renderChrome(); renderMain(); toast(X(d.id + ' staat op ' + DAG_L[d.dag] + '.', d.id + ' is on ' + DAG_L[d.dag] + '.')); } break;
      case 'step': if (d) { d.stappen[parseInt(el.getAttribute('data-i'), 10)].done = el.checked; var keep = $('.pf-db', $('#pf-detail')); var sc = keep ? keep.scrollTop : 0; renderDetail(false); var kb = $('.pf-db', $('#pf-detail')); if (kb) kb.scrollTop = sc; var again = $('[data-act="step"][data-i="' + el.getAttribute('data-i') + '"]', $('#pf-detail')); if (again) again.focus({ preventScroll: true }); } break;
      case 'ai-check': if (d && d.ai) { d.ai.gecheckt = el.checked; renderDetail(false); var c2 = $('[data-act="ai-check"]', $('#pf-detail')); if (c2) c2.focus({ preventScroll: true }); } break;
      case 'ai-edit': if (d && d.ai) { d.ai.bewerk = !d.ai.bewerk; renderDetail(false); var ta = $('#pf-aitxt'); if (ta && d.ai.bewerk) ta.focus(); else { var eb = $('[data-act="ai-edit"]', $('#pf-detail')); if (eb) eb.focus(); } } break;
      case 'ai-send': if (d && d.ai && d.ai.gecheckt) {
        var dr = draft(d.id);
        var txt = dr.ai === null ? d.ai.tekst : dr.ai;
        d.ai.verstuurd = true; d.ai.tekst = txt; dr.ai = null; d.status = 'wacht';
        d.stappen.forEach(function (s) { s.done = true; });
        d.berichten.push({ van: TEAM, klant: true, uit: 'team', txt: txt, t: NU });
        addLog(X('Antwoord bij ' + d.id + ' verstuurd na controle', 'Reply on ' + d.id + ' sent after checking'));
        refresh(); renderDetail(true);
        toast(X('Antwoord bij ' + d.id + ' is verstuurd. In dit voorbeeld gaat er niets echt weg.', 'Reply on ' + d.id + ' has been sent. In this example nothing is really sent.'));
      } break;
      case 'asst-pick': S.asstSel = parseInt(el.getAttribute('data-i'), 10); S.focusKey = null; renderMain(); var pb = root.querySelector('[data-act="asst-pick"][data-i="' + S.asstSel + '"]'); if (pb) pb.focus({ preventScroll: true }); break;
      case 'asst-toggle': var ai = parseInt(el.getAttribute('data-i'), 10); S.asstOn[ai] = !S.asstOn[ai]; renderMain(); var tb = root.querySelector('[data-act="asst-toggle"][data-i="' + ai + '"]'); if (tb) tb.focus({ preventScroll: true }); toast(ASST[ai] + (S.asstOn[ai] ? X(' staat aan.', ' is on.') : X(' staat uit.', ' is off.'))); break;
      case 'ask': ask(el.getAttribute('data-q')); break;
      case 'sync': var kk = S.koppel[parseInt(el.getAttribute('data-i'), 10)]; if (kk && kk.aan && !kk.bezig) { kk.bezig = true; renderMain(); var kfocus = root.querySelector('.pf-kl li:nth-child(' + (parseInt(el.getAttribute('data-i'), 10) + 1) + ') .pf-btn:last-child'); if (kfocus) kfocus.focus({ preventScroll: true }); clearTimeout(timers['k' + kk.id]); timers['k' + kk.id] = setTimeout(function () { kk.bezig = false; kk.sync = NU; addLog(kk.naam + X(' is gesynchroniseerd', ' has been synchronised')); if (S.view === 'koppelingen' && S.mode === 'team') renderMain(); renderChrome(); toast(kk.naam + X(' is gesynchroniseerd.', ' has been synchronised.')); }, 1100); } break;
      case 'koppel-toggle': var k2 = S.koppel[parseInt(el.getAttribute('data-i'), 10)]; k2.aan = !k2.aan; if (!k2.aan) { k2.bezig = false; clearTimeout(timers['k' + k2.id]); } addLog(k2.naam + (k2.aan ? X(' is hervat', ' has been resumed') : X(' is gepauzeerd', ' has been paused'))); var ki = el.getAttribute('data-i'); renderMain(); var kt = root.querySelector('[data-act="koppel-toggle"][data-i="' + ki + '"]'); if (kt) kt.focus({ preventScroll: true }); toast(k2.naam + (k2.aan ? X(' is weer verbonden.', ' is connected again.') : X(' is gepauzeerd.', ' is paused.'))); break;
      case 'new': openNew(); break;
      case 'new-cancel': closeNew(); break;
      case 'reset': S = seed(); renderAll(); toast(X('De voorbeeldgegevens staan weer zoals bij het begin.', 'The example data is back to how it was at the start.')); var rb = root.querySelector('[data-act="reset"]'); if (rb) rb.focus({ preventScroll: true }); break;
    }
  }
  function ask(q) {
    q = String(q || '').trim();
    if (!q || !S.asstOn[S.asstSel]) return;
    S.chat.push({ r: 'u', x: q });
    S.chat.push({ r: 'a', x: answer(q) });
    S.chatDraft = '';
    renderMain();
    var inp = $('#pf-askq'); if (inp) inp.focus({ preventScroll: true });
  }

  /* ---------- gebeurtenissen ---------- */
  root.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-act]');
    if (el && root.contains(el)) {
      if (el.tagName === 'SELECT' || (el.tagName === 'INPUT' && el.type === 'checkbox')) return;
      if (el.disabled) return;
      ev.preventDefault();
      act(el, ev);
      return;
    }
    var tr = ev.target.closest('tr[data-id]');
    if (tr && !ev.target.closest('button')) selectDossier(tr.getAttribute('data-id'));
  });
  root.addEventListener('change', function (ev) {
    var el = ev.target;
    if (el.hasAttribute('data-draft')) {
      if (el.getAttribute('data-draft') === 'zicht') {
        draft(el.getAttribute('data-id')).zicht = el.checked;
        var bx = el.parentNode.querySelector('.pf-box');
        if (bx) bx.innerHTML = el.checked ? '<svg viewBox="0 0 14 14"><path d="' + IC.check + '"/></svg>' : '';
      }
      return;
    }
    if (el.hasAttribute('data-act') && (el.tagName === 'SELECT' || el.type === 'checkbox')) act(el);
  });
  root.addEventListener('input', function (ev) {
    var el = ev.target;
    if (el.id === 'pf-q') { S.q = el.value; renderRows(); return; }
    if (el.id === 'pf-askq') { S.chatDraft = el.value; return; }
    var dk = el.getAttribute && el.getAttribute('data-draft');
    if (dk === 'note') draft(el.getAttribute('data-id')).note = el.value;
    else if (dk === 'ai') draft(el.getAttribute('data-id')).ai = el.value;
    else if (dk === 'reply') draft(el.getAttribute('data-id')).reply = el.value;
  });
  root.addEventListener('submit', function (ev) {
    var f = ev.target.closest('form[data-form]');
    if (!f) return;
    ev.preventDefault();
    var kind = f.getAttribute('data-form');
    var id = f.getAttribute('data-id');
    var d = id ? byId(id) : null;
    if (kind === 'ask') { ask($('#pf-askq').value); return; }
    var ta = $('textarea', f);
    var txt = ta ? ta.value.trim() : '';
    if (!txt) { ta.focus(); toast(X('Schrijf eerst een bericht.', 'Write a message first.')); return; }
    if (kind === 'note' && d) {
      var dr = draft(id);
      var zicht = dr.zicht;
      d.berichten.push({ van: TEAM, klant: zicht, uit: zicht ? 'team' : 'intern', txt: txt, t: NU });
      addLog(zicht ? X('Bericht aan de klant bij ', 'Message to the customer on ') + id : X('Interne notitie bij ', 'Internal note on ') + id);
      dr.note = ''; dr.zicht = false;
      renderChrome(); renderMain(); renderDetail(false);
      var nt = $('#pf-nt'); if (nt) nt.focus({ preventScroll: true });
      toast(zicht ? X('Bericht staat in het klantportaal.', 'The message is in the customer portal.') : X('Notitie toegevoegd.', 'Note added.'));
    } else if (kind === 'reply' && d) {
      var r = draft(id);
      d.berichten.push({ van: d.klant, klant: true, uit: 'klant', txt: txt, t: NU });
      if (d.status === 'wacht') d.status = 'bezig';
      addLog(d.klant + X(' reageerde bij ', ' replied on ') + id);
      r.reply = '';
      S.focusKey = null;
      refresh();
      var again = root.querySelector('#pf-r-' + id); if (again) again.focus({ preventScroll: true });
      toast(X('Je bericht is verstuurd. Het team ziet het bij ' + id + '.', 'Your message has been sent. The team sees it on ' + id + '.'));
    }
  });
  dlg.addEventListener('submit', function (ev) { ev.preventDefault(); submitNew(); });
  dlg.addEventListener('input', function () { var inp = $('#pf-nti', dlg); if (inp && inp.value.trim()) { $('#pf-ne', dlg).hidden = true; inp.removeAttribute('aria-invalid'); } });
  dlg.addEventListener('click', function (ev) { if (ev.target === dlg) closeNew(); });
  dlg.addEventListener('close', function () { var a = document.activeElement; if (a && a !== document.body && root.contains(a) && !dlg.contains(a)) return; var b = root.querySelector('[data-act="new"]'); if (b) b.focus({ preventScroll: true }); });

  root.addEventListener('keydown', function (ev) {
    var k = ev.key, t = ev.target;
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
    if (k === 'Escape' && !dlg.open && S.sel) { ev.preventDefault(); ev.stopPropagation(); closeDetail(); return; }
    if ((k === 'n' || k === 'N') && !typing && !ev.ctrlKey && !ev.metaKey && !ev.altKey && !dlg.open) { ev.preventDefault(); openNew(); return; }
    if ((k === 'ArrowDown' || k === 'ArrowUp') && t.classList && (t.classList.contains('pf-rowbtn') || t.classList.contains('pf-li') || t.classList.contains('pf-pb'))) {
      var all = $$('.' + t.classList[0], $('#pf-main'));
      var i = all.indexOf(t);
      var n = all[i + (k === 'ArrowDown' ? 1 : -1)];
      if (n) { ev.preventDefault(); n.focus(); }
    }
  });

  // startknoppen buiten het venster
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-pf-go]');
    if (!b) return;
    var p = b.getAttribute('data-pf-go').split(':');
    if (p[0] === 'dossier') { S.mode = 'team'; S.view = 'dossiers'; S.filter = 'alle'; S.q = ''; S.sel = p[1]; renderAll(true); }
    else if (p[0] === 'view') { S.mode = 'team'; S.view = p[1]; S.sel = null; renderAll(); }
    else if (p[0] === 'mode') { S.mode = p[1]; S.sel = null; renderAll(); }
    root.scrollIntoView({ block: 'nearest' });
  });

  root.classList.add('is-ready');
  renderAll();
})();
