export const appsScript = `// Trainleaf v2 · weekly plan synchronization
// Script Properties: FIELDWORK_SECRET (32+ characters), FIELDWORK_SHEET_ID.
function doPost(e) {
  var lock = LockService.getScriptLock();
  function reply(x) { return ContentService.createTextOutput(JSON.stringify(x)).setMimeType(ContentService.MimeType.JSON); }
  function safe(c) { return typeof c === 'string' && /^[\\s]*[=+\\-@]/.test(c) ? "'" + c : c; }
  function validRows(rows, width, max) { return Array.isArray(rows) && rows.length > 0 && rows.length <= max && rows.every(function(r) { return Array.isArray(r) && r.length === width && r.every(function(c) { return typeof c === 'string' && c.length <= 15000 || typeof c === 'number' && Number.isFinite(c); }); }); }
  try {
    var p = JSON.parse(e.postData.contents), props = PropertiesService.getScriptProperties();
    var secret = props.getProperty('FIELDWORK_SECRET'), sheetId = props.getProperty('FIELDWORK_SHEET_ID');
    if (!secret || secret.length < 32 || p.secret !== secret || p.spreadsheetId !== sheetId) throw Error('Invalid connection key or spreadsheet.');
    if (!/^[a-f0-9]{24}$/.test(p.installation) || !/^[a-zA-Z0-9_-]{1,100}$/.test(p.profileId) || !Number.isSafeInteger(p.revision) || p.revision < 0 || typeof p.requestId !== 'string') throw Error('Invalid export identity.');
    if (!validRows(p.rows,24,50000) || !Array.isArray(p.weeks) || p.weeks.length > 1000) throw Error('Update the bridge to FIELDWORK v2.');
    if (!p.weeks.every(function(w) { return /^\\d{4}-\\d{2}-\\d{2}$/.test(w.key) && w.title === 'FW ' + w.key && validRows(w.rows,8,15000) && ['dayRows','sectionRows'].every(function(k) { return Array.isArray(w[k]) && w[k].every(function(n) { return Number.isInteger(n) && n > 0 && n <= w.rows.length; }); }); })) throw Error('Invalid weekly plan.');
    if (new Set(p.weeks.map(function(w) { return w.key; })).size !== p.weeks.length) throw Error('Repeated week.');
    lock.waitLock(20000);
    var book = SpreadsheetApp.openById(sheetId), owner = 'fieldwork:' + p.installation + ':' + p.profileId;
    var ownerKey = 'FIELDWORK_OWNER';
    var existingOwner = props.getProperty(ownerKey);
    if (existingOwner && existingOwner !== owner) throw Error('This bridge is linked to a different profile.');
    var revisionKey = 'fieldwork_v2_revision', previous = Number(props.getProperty(revisionKey) || -1);
    if (!Number.isSafeInteger(previous) || previous < -1) throw Error('Invalid saved export revision.');
    if (p.revision < previous) throw Error('A newer plan is already stored in this spreadsheet.');
    var dataName = 'FW_' + p.installation.slice(0,8) + '_' + p.profileId.slice(0,50);
    function assertOwned(name) { var sheet = book.getSheetByName(name); if (!sheet) return; var meta = sheet.getDeveloperMetadata().filter(function(m) { return m.getKey() === 'fieldwork_owner'; }); if (meta.length !== 1 || meta[0].getValue() !== owner) throw Error('Tab "' + name + '" contains data not managed by FIELDWORK. Rename it before syncing.'); }
    assertOwned(dataName); p.weeks.forEach(function(w) { assertOwned(w.title); });
    // Reserve the bridge before writing; a partial failure must not let another
    // profile claim the same spreadsheet on its next request.
    props.setProperty(ownerKey,owner);
    function owned(name) { var sheet = book.getSheetByName(name); if (!sheet) { sheet = book.insertSheet(name); sheet.addDeveloperMetadata('fieldwork_owner',owner); } return sheet; }
    function write(sheet,rows,width) { var old = sheet.getLastRow(); if (sheet.getMaxRows() < rows.length) sheet.insertRowsAfter(sheet.getMaxRows(),rows.length-sheet.getMaxRows()); if(sheet.getMaxColumns()<width) sheet.insertColumnsAfter(sheet.getMaxColumns(),width-sheet.getMaxColumns()); sheet.getRange(1,1,Math.max(old,rows.length),width).breakApart(); sheet.getRange(1,1,rows.length,width).setValues(rows.map(function(r){return r.map(safe);})).setWrap(true).setVerticalAlignment('top'); if(old>rows.length) sheet.getRange(rows.length+1,1,old-rows.length,width).clearContent(); }
    var data = owned(dataName); write(data,p.rows,24); data.getRange(1,1,1,24).setFontWeight('bold').setBackground('#e9f0fc'); data.setFrozenRows(1);
    p.weeks.forEach(function(w) {
      var sheet = owned(w.title); write(sheet,w.rows,8);
      sheet.getRange(1,1,w.rows.length,8).setBackground('#ffffff').setFontColor('#17273b').setFontSize(10).setFontWeight('normal');
      sheet.getRange(1,1,1,8).merge().setBackground('#12263c').setFontColor('#ffffff').setFontWeight('bold').setFontSize(13);
      w.dayRows.forEach(function(row) { sheet.getRange(row,1,1,8).merge().setBackground('#284d75').setFontColor('#ffffff').setFontWeight('bold'); if(row<w.rows.length) sheet.getRange(row+1,1,1,8).setBackground('#e9f0fc').setFontWeight('bold'); });
      w.sectionRows.forEach(function(row) { sheet.getRange(row,1,1,8).setBackground('#f0f4f8').setFontWeight('bold'); });
      sheet.setColumnWidth(1,115); sheet.setColumnWidth(2,270); sheet.setColumnWidth(3,90); sheet.setColumnWidths(4,3,170); sheet.setColumnWidths(7,2,320); sheet.setFrozenRows(1);
    });
    // Preserve old tabs; clear only owned weekly content removed from the app.
    var active = new Set(p.weeks.map(function(w) { return w.title; }));
    book.getSheets().forEach(function(sheet) { if (!/^FW \\d{4}-\\d{2}-\\d{2}$/.test(sheet.getName()) || active.has(sheet.getName())) return; var metadata=sheet.getDeveloperMetadata().filter(function(m){return m.getKey()==='fieldwork_owner';}); if(metadata.length===1&&metadata[0].getValue()===owner) { write(sheet,[[sheet.getName(),'Brak wpisów w aktualnym planie','','','','','','']],8); } });
    SpreadsheetApp.flush(); props.setProperty(ownerKey,owner); props.setProperty(revisionKey,String(p.revision));
    return reply({success:true,requestId:p.requestId,profileId:p.profileId,revision:p.revision,rows:p.rows.length-1,weeks:p.weeks.length,sheetName:dataName});
  } catch(err) { return reply({success:false,error:String(err.message||err)}); }
  finally { if(lock.hasLock()) lock.releaseLock(); }
}
`;
