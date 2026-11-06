/**************************************************************************************
 * SISTEMA DE TRIVIA EN VIVO - JUVENTUD CATÓLICA
 * Google Apps Script para Google Sheets
 * --------------------------------------------------------------------------------
 * Flujo general:
 *   WhatsApp  ->  Make.com  ->  Pestaña "Respuestas_Entrantes"
 *   Tú marcas la respuesta correcta en "Control_Trivia"
 *   Ejecutas las funciones para obtener los textos de ganadores
 *
 * Pestañas que usa este script (se crean solas con la función crearPestanas):
 *   1. Respuestas_Entrantes   -> donde Make.com deja cada respuesta
 *   2. Control_Trivia         -> donde defines la respuesta correcta y los puntos
 *   3. Resultados_Dia         -> resumen del día + Campeón de la Jornada
 *   4. Ranking_General        -> acumulado de toda la temporada
 **************************************************************************************/

// ====================== CONFIGURACIÓN GENERAL ======================
const CONFIG = {
  HOJA_RESPUESTAS: 'Respuestas_Entrantes',
  HOJA_CONTROL: 'Control_Trivia',
  HOJA_RESULTADOS: 'Resultados_Dia',
  HOJA_RANKING: 'Ranking_General',

  // Puntos por defecto si no se definen en Control_Trivia
  PUNTOS_DEFAULT: { primero: 3, segundo: 2, tercero: 1 },

  // Zona horaria para mostrar tiempos (ajústala a tu país)
  ZONA_HORARIA: 'America/Mexico_City'
};

// ====================== MENÚ EN GOOGLE SHEETS ======================
/**
 * Crea un menú personalizado "🎯 Trivia" al abrir la hoja.
 * Así ejecutas todo con clics, sin entrar al editor de código.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🎯 Trivia')
    .addItem('⚙️ Crear/Reparar Pestañas', 'crearPestanas')
    .addSeparator()
    .addItem('📊 Resultado de UNA Pregunta', 'menuResultadoPregunta')
    .addItem('🏆 Campeón del Día', 'menuGanadorDelDia')
    .addSeparator()
    .addItem('📅 Cerrar Jornada y Actualizar Ranking', 'menuCerrarJornada')
    .addToUi();
}

// ====================== 1) CREACIÓN DE PESTAÑAS ======================
/**
 * Crea las 4 pestañas con sus encabezados si no existen.
 * Es seguro ejecutarla varias veces: no borra datos existentes.
 */
function crearPestanas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // --- Respuestas_Entrantes ---
  let hR = ss.getSheetByName(CONFIG.HOJA_RESPUESTAS);
  if (!hR) hR = ss.insertSheet(CONFIG.HOJA_RESPUESTAS);
  if (hR.getLastRow() === 0) {
    hR.appendRow(['Timestamp', 'Dia_Fecha', 'Pregunta_ID', 'Usuario', 'Respuesta']);
    hR.getRange('A1:E1').setFontWeight('bold').setBackground('#4285F4').setFontColor('#FFFFFF');
    hR.setFrozenRows(1);
  }

  // --- Control_Trivia ---
  let hC = ss.getSheetByName(CONFIG.HOJA_CONTROL);
  if (!hC) hC = ss.insertSheet(CONFIG.HOJA_CONTROL);
  if (hC.getLastRow() === 0) {
    hC.appendRow(['Pregunta_ID', 'Respuesta_Correcta', 'Estado', 'Puntos_1', 'Puntos_2', 'Puntos_3']);
    hC.getRange('A1:F1').setFontWeight('bold').setBackground('#34A853').setFontColor('#FFFFFF');
    hC.setFrozenRows(1);
    // Fila de ejemplo
    hC.appendRow(['P1', 'A', 'Abierta', 3, 2, 1]);
    hC.appendRow(['P2', 'C', 'Cerrada', 3, 2, 1]);
  }

  // --- Resultados_Dia ---
  let hD = ss.getSheetByName(CONFIG.HOJA_RESULTADOS);
  if (!hD) hD = ss.insertSheet(CONFIG.HOJA_RESULTADOS);
  if (hD.getLastRow() === 0) {
    hD.appendRow(['Dia_Fecha', 'Usuario', 'Puntos_Dia', 'Aciertos_Dia', 'Preguntas_Ganadas']);
    hD.getRange('A1:E1').setFontWeight('bold').setBackground('#FBBC04').setFontColor('#000000');
    hD.setFrozenRows(1);
  }

  // --- Ranking_General ---
  let hG = ss.getSheetByName(CONFIG.HOJA_RANKING);
  if (!hG) hG = ss.insertSheet(CONFIG.HOJA_RANKING);
  if (hG.getLastRow() === 0) {
    hG.appendRow(['Usuario', 'Puntos_Totales', 'Jornadas_Ganadas', 'Aciertos_Totales']);
    hG.getRange('A1:D1').setFontWeight('bold').setBackground('#EA4335').setFontColor('#FFFFFF');
    hG.setFrozenRows(1);
  }

  SpreadsheetApp.getActiveSpreadsheet().toast('Pestañas listas ✅', 'Trivia', 5);
}

// ====================== 2) UTILIDADES INTERNAS ======================

/**
 * Lee todas las respuestas y devuelve un mapa:
 *   preguntaId -> [ {usuario, respuesta, timestamp(Date), ms} ... ]
 * Aplica la lógica ANTI-DUPLICADOS: para cada (preguntaId, usuario)
 * se conserva SOLO la primera respuesta (la de menor timestamp).
 */
function _leerRespuestas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hR = ss.getSheetByName(CONFIG.HOJA_RESPUESTAS);
  if (!hR || hR.getLastRow() < 2) return {};

  const datos = hR.getRange(2, 1, hR.getLastRow() - 1, 5).getValues();
  // Estructura temporal: clave "preguntaId||usuario" -> registro más temprano
  const primeras = {};

  datos.forEach(fila => {
    const tsRaw = fila[0];
    const preguntaId = String(fila[2]).trim();
    const usuario = String(fila[3]).trim();
    const respuesta = _normalizarRespuesta(fila[4]);
    if (!preguntaId || !usuario || !respuesta) return;

    const ts = _aFecha(tsRaw);
    if (!ts) return;

    const clave = preguntaId + '||' + usuario.toLowerCase();
    const registro = { usuario, respuesta, timestamp: ts, ms: ts.getTime() };

    // Solo conservamos la PRIMERA (menor timestamp) => anti-duplicados
    if (!primeras[clave] || registro.ms < primeras[clave].ms) {
      primeras[clave] = registro;
    }
  });

  // Reagrupar por preguntaId
  const porPregunta = {};
  Object.keys(primeras).forEach(clave => {
    const preguntaId = clave.split('||')[0];
    if (!porPregunta[preguntaId]) porPregunta[preguntaId] = [];
    porPregunta[preguntaId].push(primeras[clave]);
  });

  return porPregunta;
}

/**
 * Lee la configuración de una pregunta desde Control_Trivia.
 * Devuelve { correcta, estado, puntos:[p1,p2,p3] } o null si no existe.
 */
function _leerControl(preguntaId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hC = ss.getSheetByName(CONFIG.HOJA_CONTROL);
  if (!hC || hC.getLastRow() < 2) return null;

  const datos = hC.getRange(2, 1, hC.getLastRow() - 1, 6).getValues();
  for (let i = 0; i < datos.length; i++) {
    if (String(datos[i][0]).trim() === String(preguntaId).trim()) {
      const p1 = Number(datos[i][3]) || CONFIG.PUNTOS_DEFAULT.primero;
      const p2 = Number(datos[i][4]) || CONFIG.PUNTOS_DEFAULT.segundo;
      const p3 = Number(datos[i][5]) || CONFIG.PUNTOS_DEFAULT.tercero;
      return {
        correcta: _normalizarRespuesta(datos[i][1]),
        estado: String(datos[i][2]).trim(),
        puntos: [p1, p2, p3]
      };
    }
  }
  return null;
}

/**
 * Normaliza una respuesta a una letra MAYÚSCULA A/B/C/D.
 *
 * NO distingue mayúsculas de minúsculas: "a" y "A" devuelven ambas "A".
 * Esto garantiza que si el usuario responde "a" y la correcta es "A",
 * igual cuente como acierto. Lo mismo al revés.
 *
 * Acepta formatos: "a", "A", "!resp B", "respuesta: c", " d ", etc.
 */
function _normalizarRespuesta(valor) {
  if (valor === null || valor === undefined) return '';
  // toUpperCase() iguala mayúsculas/minúsculas ANTES de comparar
  let t = String(valor).toUpperCase().trim();
  // Quitar prefijos comunes ("!resp", "respuesta:", etc.)
  t = t.replace(/^!?\s*RESP(UESTA)?\s*[:.]?\s*/, '');
  // Buscar la primera letra válida A-D en el texto
  const m = t.match(/[ABCD]/);
  return m ? m[0] : '';
}

/**
 * Convierte un valor de celda (Date, número epoch, o texto) a objeto Date.
 */
function _aFecha(valor) {
  if (valor instanceof Date) return valor;
  if (typeof valor === 'number') return new Date(valor);
  const d = new Date(valor);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formatea una diferencia en milisegundos a "mm:ss.mmm" o "ss.mmm s".
 */
function _formatearTiempo(ms) {
  if (ms < 0) ms = 0;
  const totalSeg = Math.floor(ms / 1000);
  const min = Math.floor(totalSeg / 60);
  const seg = totalSeg % 60;
  const milis = ms % 1000;
  const milisStr = ('000' + milis).slice(-3);
  if (min > 0) {
    return min + 'm ' + ('0' + seg).slice(-2) + '.' + milisStr + 's';
  }
  return seg + '.' + milisStr + 's';
}

/**
 * Calcula el podio de una pregunta.
 * Devuelve { correcta, ganadores:[{usuario, timestamp, puntos, posicion, tiempoDesdePrimero}], tInicio }
 * Los ganadores están ordenados por tiempo (más rápido primero) y solo los que acertaron.
 */
function _calcularPodio(preguntaId) {
  const control = _leerControl(preguntaId);
  if (!control || !control.correcta) {
    return { error: 'No hay respuesta correcta definida para ' + preguntaId + ' en Control_Trivia.' };
  }

  const todas = _leerRespuestas();
  const respuestasPregunta = todas[preguntaId] || [];

  // Respuesta correcta normalizada a mayúscula (por si en Control_Trivia
  // la escribiste en minúscula, ej. "a" en vez de "A").
  const correctaNorm = String(control.correcta).toUpperCase().trim();

  // Filtrar solo quienes acertaron.
  // Ambos lados ya vienen en MAYÚSCULA desde _normalizarRespuesta, así que
  // "a" del usuario == "A" correcta. Igualamos de nuevo por seguridad.
  const correctos = respuestasPregunta
    .filter(r => String(r.respuesta).toUpperCase().trim() === correctaNorm)
    .sort((a, b) => a.ms - b.ms); // más rápido primero

  if (correctos.length === 0) {
    return { correcta: control.correcta, ganadores: [], totalRespuestas: respuestasPregunta.length };
  }

  const tInicio = correctos[0].ms; // el primer acierto marca el "cero" de referencia
  const ganadores = [];
  for (let i = 0; i < Math.min(3, correctos.length); i++) {
    ganadores.push({
      usuario: correctos[i].usuario,
      timestamp: correctos[i].timestamp,
      puntos: control.puntos[i],
      posicion: i + 1,
      tiempoDesdePrimero: correctos[i].ms - tInicio
    });
  }

  return {
    correcta: control.correcta,
    ganadores: ganadores,
    totalRespuestas: respuestasPregunta.length,
    totalAciertos: correctos.length
  };
}

// ====================== 3) GENERADORES DE MENSAJES WHATSAPP ======================

/**
 * Devuelve un texto con formato WhatsApp (emojis + *negritas*) con el podio
 * de una pregunta: 1º, 2º, 3º lugar y el tiempo de respuesta.
 *
 * Uso: obtenerResultadoPregunta('P1')
 */
function obtenerResultadoPregunta(preguntaId) {
  const podio = _calcularPodio(preguntaId);
  if (podio.error) return '⚠️ ' + podio.error;

  const medallas = ['🥇', '🥈', '🥉'];
  let msg = '';
  msg += '🎯 *RESULTADO DE LA PREGUNTA ' + preguntaId + '*\n';
  msg += '✅ Respuesta correcta: *' + podio.correcta + '*\n';
  msg += '━━━━━━━━━━━━━━━━━━━━\n';

  if (podio.ganadores.length === 0) {
    msg += '😅 Nadie acertó esta vez. ¡Mucho ánimo para la siguiente!\n';
    return msg;
  }

  podio.ganadores.forEach(g => {
    const tiempoTxt = g.posicion === 1
      ? '⚡ ¡El más rápido!'
      : '(+' + _formatearTiempo(g.tiempoDesdePrimero) + ')';
    msg += medallas[g.posicion - 1] + ' *' + g.usuario + '* — ' + g.puntos + ' pts  ' + tiempoTxt + '\n';
  });

  msg += '━━━━━━━━━━━━━━━━━━━━\n';
  msg += '👥 Acertaron ' + podio.totalAciertos + ' de ' + podio.totalRespuestas + ' respuestas.\n';
  msg += '🙏 ¡Gloria a Dios y a seguir aprendiendo!';
  return msg;
}

/**
 * Calcula los puntos del día por usuario, declara al Campeón de la Jornada
 * y devuelve el mensaje con la tabla del día en formato WhatsApp.
 *
 * Además escribe/actualiza la pestaña Resultados_Dia.
 *
 * Uso: obtenerGanadorDelDia()
 */
function obtenerGanadorDelDia() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hC = ss.getSheetByName(CONFIG.HOJA_CONTROL);
  if (!hC || hC.getLastRow() < 2) return '⚠️ No hay preguntas en Control_Trivia.';

  const controlDatos = hC.getRange(2, 1, hC.getLastRow() - 1, 6).getValues();
  const preguntaIds = controlDatos.map(f => String(f[0]).trim()).filter(Boolean);

  // Acumular puntos por usuario en el día
  // usuario -> { puntos, aciertos, ganadas }
  const totales = {};

  preguntaIds.forEach(pid => {
    const podio = _calcularPodio(pid);
    if (podio.error || !podio.ganadores) return;
    podio.ganadores.forEach(g => {
      if (!totales[g.usuario]) totales[g.usuario] = { puntos: 0, aciertos: 0, ganadas: 0 };
      totales[g.usuario].puntos += g.puntos;
      totales[g.usuario].aciertos += 1;
      if (g.posicion === 1) totales[g.usuario].ganadas += 1;
    });
  });

  const ranking = Object.keys(totales).map(u => ({
    usuario: u,
    puntos: totales[u].puntos,
    aciertos: totales[u].aciertos,
    ganadas: totales[u].ganadas
  })).sort((a, b) => b.puntos - a.puntos || b.aciertos - a.aciertos);

  if (ranking.length === 0) {
    return '😅 Aún no hay puntos registrados hoy. Define las respuestas correctas en Control_Trivia.';
  }

  // Guardar en Resultados_Dia
  _guardarResultadosDia(ranking);

  // Construir mensaje
  const fecha = Utilities.formatDate(new Date(), CONFIG.ZONA_HORARIA, 'dd/MM/yyyy');
  const campeon = ranking[0];
  let msg = '';
  msg += '🏆 *CAMPEÓN DE LA JORNADA* 🏆\n';
  msg += '📅 ' + fecha + '\n';
  msg += '━━━━━━━━━━━━━━━━━━━━\n';
  msg += '👑 *' + campeon.usuario + '* con *' + campeon.puntos + ' puntos*!\n';
  msg += '🎉 ¡Felicidades, campeón/a de hoy!\n';
  msg += '━━━━━━━━━━━━━━━━━━━━\n';
  msg += '📊 *TABLA DEL DÍA*\n';

  const medallas = ['🥇', '🥈', '🥉'];
  ranking.forEach((r, i) => {
    const icono = i < 3 ? medallas[i] : '  ' + (i + 1) + '.';
    msg += icono + ' ' + r.usuario + ' — *' + r.puntos + ' pts* (' + r.aciertos + ' aciertos)\n';
  });

  msg += '━━━━━━━━━━━━━━━━━━━━\n';
  msg += '🙏 ¡Que Dios los bendiga! Nos vemos la próxima semana.';
  return msg;
}

/**
 * Sobrescribe la pestaña Resultados_Dia con el ranking del día actual.
 */
function _guardarResultadosDia(ranking) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let hD = ss.getSheetByName(CONFIG.HOJA_RESULTADOS);
  if (!hD) { crearPestanas(); hD = ss.getSheetByName(CONFIG.HOJA_RESULTADOS); }

  // Limpiar datos previos (deja encabezado)
  if (hD.getLastRow() > 1) {
    hD.getRange(2, 1, hD.getLastRow() - 1, hD.getLastColumn()).clearContent();
  }

  const fecha = Utilities.formatDate(new Date(), CONFIG.ZONA_HORARIA, 'dd/MM/yyyy');
  const filas = ranking.map(r => [fecha, r.usuario, r.puntos, r.aciertos, r.ganadas]);
  if (filas.length) {
    hD.getRange(2, 1, filas.length, 5).setValues(filas);
  }
}

// ====================== 4) CIERRE DE JORNADA Y RANKING GENERAL ======================

/**
 * Toma el ranking del día (Resultados_Dia) y lo suma al Ranking_General.
 * El Campeón del Día suma +1 en "Jornadas_Ganadas".
 *
 * Ejecútala UNA sola vez al final de cada reunión.
 */
function cerrarJornadaYActualizarRanking() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hD = ss.getSheetByName(CONFIG.HOJA_RESULTADOS);
  if (!hD || hD.getLastRow() < 2) {
    return '⚠️ No hay resultados del día. Ejecuta primero "Campeón del Día".';
  }

  const datosDia = hD.getRange(2, 1, hD.getLastRow() - 1, 5).getValues();

  let hG = ss.getSheetByName(CONFIG.HOJA_RANKING);
  if (!hG) { crearPestanas(); hG = ss.getSheetByName(CONFIG.HOJA_RANKING); }

  // Cargar ranking general existente en un mapa
  const general = {}; // usuario -> {puntos, jornadas, aciertos, fila}
  if (hG.getLastRow() > 1) {
    const datosG = hG.getRange(2, 1, hG.getLastRow() - 1, 4).getValues();
    datosG.forEach((f, idx) => {
      const u = String(f[0]).trim();
      if (!u) return;
      general[u.toLowerCase()] = {
        usuario: u,
        puntos: Number(f[1]) || 0,
        jornadas: Number(f[2]) || 0,
        aciertos: Number(f[3]) || 0
      };
    });
  }

  // Determinar campeón del día (mayor puntaje)
  let campeon = null;
  datosDia.forEach(f => {
    const pts = Number(f[2]) || 0;
    if (!campeon || pts > campeon.pts) campeon = { usuario: String(f[1]).trim(), pts: pts };
  });

  // Sumar día al general
  datosDia.forEach(f => {
    const u = String(f[1]).trim();
    if (!u) return;
    const k = u.toLowerCase();
    if (!general[k]) general[k] = { usuario: u, puntos: 0, jornadas: 0, aciertos: 0 };
    general[k].puntos += Number(f[2]) || 0;
    general[k].aciertos += Number(f[3]) || 0;
    if (campeon && u.toLowerCase() === campeon.usuario.toLowerCase()) {
      general[k].jornadas += 1;
    }
  });

  // Reescribir ranking general ordenado
  const arr = Object.keys(general).map(k => general[k])
    .sort((a, b) => b.puntos - a.puntos || b.jornadas - a.jornadas);

  if (hG.getLastRow() > 1) {
    hG.getRange(2, 1, hG.getLastRow() - 1, 4).clearContent();
  }
  const filas = arr.map(r => [r.usuario, r.puntos, r.jornadas, r.aciertos]);
  if (filas.length) hG.getRange(2, 1, filas.length, 4).setValues(filas);

  return '✅ Jornada cerrada. Campeón del día: ' + (campeon ? campeon.usuario : '—') +
         '. Ranking general actualizado con ' + filas.length + ' participantes.';
}

// ====================== 5) WRAPPERS PARA EL MENÚ (diálogos) ======================

function menuResultadoPregunta() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.prompt('Resultado de Pregunta', 'Escribe el Pregunta_ID (ej. P1):', ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  const pid = resp.getResponseText().trim();
  if (!pid) { ui.alert('Debes escribir un Pregunta_ID.'); return; }
  const texto = obtenerResultadoPregunta(pid);
  _mostrarTextoCopiable('Resultado ' + pid, texto);
}

function menuGanadorDelDia() {
  const texto = obtenerGanadorDelDia();
  _mostrarTextoCopiable('Campeón del Día', texto);
}

function menuCerrarJornada() {
  const ui = SpreadsheetApp.getUi();
  const conf = ui.alert('Cerrar Jornada',
    '¿Sumar los resultados del día al Ranking General? Hazlo solo UNA vez al final.',
    ui.ButtonSet.YES_NO);
  if (conf !== ui.Button.YES) return;
  const msg = cerrarJornadaYActualizarRanking();
  ui.alert(msg);
}

/**
 * Muestra un cuadro de diálogo con el texto seleccionable para copiar a WhatsApp.
 */
function _mostrarTextoCopiable(titulo, texto) {
  const htmlEscapado = texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = HtmlService.createHtmlOutput(
    '<div style="font-family:Arial;padding:10px;">' +
    '<p style="color:#555;">Selecciona todo y copia (Ctrl+C) para pegar en WhatsApp:</p>' +
    '<textarea style="width:100%;height:280px;font-size:14px;" readonly ' +
    'onclick="this.select()">' + htmlEscapado + '</textarea>' +
    '</div>'
  ).setWidth(450).setHeight(380);
  SpreadsheetApp.getUi().showModalDialog(html, titulo);
}
