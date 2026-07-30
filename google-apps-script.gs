/**
 * Board Game Collection — Google Sheet sync backend
 * ---------------------------------------------------
 * One-time setup:
 *   1. Create a blank Google Sheet (go to sheets.new)
 *   2. Extensions -> Apps Script
 *   3. Delete anything there, paste ALL of this file, click Save (disk icon)
 *   4. Deploy -> New deployment -> (gear) Web app
 *        Execute as: Me      |     Who has access: Anyone
 *      Click Deploy, authorise (your account -> Advanced -> "Go to ... (unsafe)" -> Allow)
 *   5. Copy the "Web app URL" and paste it into the app (menu -> Google Sheet sync)
 *
 * The app POSTs {action:'save', games, plays, meta} to store, and GETs to restore.
 */

var T_COLLECTION = 'Collection';
var T_PLAYS      = 'Plays';
var T_REMOVED    = 'Removed';      // games no longer owned (sold / gifted / etc.)
var T_PENDING    = 'Pending';      // games coming via crowdfunding
var T_DATA       = '_data';        // hidden: lossless JSON for exact restore

function doGet(e)  { return respond(readAll()); }

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (body.action === 'save') {
      writeAll(body);
      return respond({ ok: true, saved: true, count: (body.games || []).length });
    }
    return respond(readAll());
  } catch (err) {
    return respond({ ok: false, error: String(err) });
  }
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
                       .setMimeType(ContentService.MimeType.JSON);
}

function ss()          { return SpreadsheetApp.getActiveSpreadsheet(); }
function sheet(name)   { return ss().getSheetByName(name) || ss().insertSheet(name); }

function writeAll(data) {
  var games = data.games || [];
  var plays = data.plays || [];
  var owned   = games.filter(function (g) { return !g.removed && !g.pending; });
  var gone    = games.filter(function (g) { return g.removed; });
  var pending = games.filter(function (g) { return g.pending; });

  // ---- Collection tab (readable, with cover thumbnails) ----
  var col = sheet(T_COLLECTION);
  col.clear();
  col.getRange(1, 1, 1, 7).setValues([['Cover', 'Name', 'Year', 'Type', 'Copies', 'Plays', 'Comment']]);
  col.getRange(1, 1, 1, 7).setFontWeight('bold');
  var rows = owned.map(function (g) {
    return [
      g.thumbnail ? '=IMAGE("' + g.thumbnail + '")' : '',
      g.name || '',
      g.year || '',
      g.__type || 'Game',
      g.copies || 1,
      g.__plays || 0,
      g.comment || ''
    ];
  });
  if (rows.length) {
    col.getRange(2, 1, rows.length, 7).setValues(rows);
    col.setColumnWidth(1, 90);
    col.setColumnWidth(2, 280);
    col.setRowHeights(2, rows.length, 64);
  }
  col.setFrozenRows(1);

  // ---- Plays tab ----
  var pl = sheet(T_PLAYS);
  pl.clear();
  pl.getRange(1, 1, 1, 6).setValues([['Date', 'Game', 'Players', 'Winner', 'Score', 'Notes']]);
  pl.getRange(1, 1, 1, 6).setFontWeight('bold');
  var prows = plays.map(function (p) {
    return [p.date || '', p.__gameName || p.gameId || '', p.players || '', p.winner || '', p.score || '', p.notes || ''];
  });
  if (prows.length) pl.getRange(2, 1, prows.length, 6).setValues(prows);
  pl.setFrozenRows(1);

  // ---- Removed tab (games you no longer own) ----
  var rm = sheet(T_REMOVED);
  rm.clear();
  rm.getRange(1, 1, 1, 4).setValues([['Name', 'Year', 'Removed on', 'Note']]);
  rm.getRange(1, 1, 1, 4).setFontWeight('bold');
  var rrows = gone.map(function (g) { return [g.name || '', g.year || '', g.removedDate || '', g.removedNote || '']; });
  if (rrows.length) rm.getRange(2, 1, rrows.length, 4).setValues(rrows);
  rm.setFrozenRows(1);

  // ---- Pending tab (games coming via crowdfunding) ----
  var pd = sheet(T_PENDING);
  pd.clear();
  pd.getRange(1, 1, 1, 3).setValues([['Name', 'Year', 'Note']]);
  pd.getRange(1, 1, 1, 3).setFontWeight('bold');
  var pdrows = pending.map(function (g) { return [g.name || '', g.year || '', g.pendingNote || '']; });
  if (pdrows.length) pd.getRange(2, 1, pdrows.length, 3).setValues(pdrows);
  pd.setFrozenRows(1);

  // ---- hidden raw JSON for exact restore ----
  var d = sheet(T_DATA);
  d.clear();
  d.getRange(1, 1).setValue(JSON.stringify({ games: games, plays: plays, meta: data.meta || {} }));
  try { d.hideSheet(); } catch (e) {}
}

function readAll() {
  var d = ss().getSheetByName(T_DATA);
  if (d) {
    var raw = d.getRange(1, 1).getValue();
    if (raw) { try { return JSON.parse(raw); } catch (e) {} }
  }
  return { games: [], plays: [] };
}
