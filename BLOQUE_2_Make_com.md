# BLOQUE 2 — Configuración paso a paso de Make.com (sin programar)

Objetivo: cada vez que alguien escriba una respuesta (A/B/C/D o `!resp X`) en el grupo de WhatsApp, Make.com la copie automáticamente como una fila nueva en la pestaña **`Respuestas_Entrantes`** de tu Google Sheet.

El escenario tiene **3 módulos** en fila:

```
[1. Disparador WhatsApp]  →  [2. Filtro A/B/C/D]  →  [3. Google Sheets: Add a Row]
```

---

## 1) Módulo Disparador (Trigger) — Escuchar mensajes de WhatsApp

Tienes 3 opciones. Elige **una** según lo que tengas a mano:

### Opción recomendada para empezar rápido: **Green API** (WhatsApp con QR, tipo "WhatsApp Web")
- Es la más simple para un grupo de jóvenes porque **vinculas tu WhatsApp normal escaneando un QR**, sin trámites de Meta.
- Módulo a buscar en Make: **Green API → Watch Incoming Messages** (o "Watch Webhooks").
- Ventaja: funciona con tu número personal/ministerio tal cual.
- Nota: Green API es un servicio externo (tiene plan gratuito limitado).

### Opción profesional: **WhatsApp Business Cloud API** (de Meta)
- Módulo: **WhatsApp Business Cloud → Watch Events** (webhook de mensajes entrantes).
- Requiere una cuenta de Meta Business, un número verificado y una app en Meta for Developers.
- Importante: la Cloud API de Meta está pensada para mensajes 1 a 1 / plantillas; **la lectura automática de mensajes de un grupo normal es limitada**. Para trivia en un grupo, Green API o Twilio suelen ir mejor.

### Opción intermedia: **Twilio API for WhatsApp**
- Módulo: **Twilio → Watch Events** o un **Webhook personalizado** apuntando al número de Twilio.
- Requiere cuenta de Twilio y un número habilitado para WhatsApp.

> 👉 Para una trivia de grupo de juventud, **Green API** es la vía más directa. El resto de la guía usa los nombres de campo típicos de Green API, pero el concepto es idéntico en las otras: solo cambian los nombres de las variables.

### Campos que entrega el disparador (los usaremos después)
Según el proveedor, el módulo disparador te dará variables parecidas a estas:
- `senderName` / `pushName` → **nombre del que respondió** (lo usaremos como `Usuario`).
- `senderId` / `from` → número/ID (respaldo por si no hay nombre).
- `messageText` / `body` / `textMessage` → **el texto del mensaje** (de aquí sacamos A/B/C/D).
- `chatId` / `groupId` → ID del grupo (útil para filtrar SOLO tu grupo).
- `timestamp` → hora del proveedor (NO la usaremos para el ranking; usaremos el reloj de Make, ver módulo 3).

---

## 2) Filtros — Procesar solo respuestas válidas

Entre el módulo 1 y el 3, haz clic en el "cablecito" y añade un **Filtro** (el ícono de la llave inglesa). Pon estas condiciones.

### Filtro A — Solo mensajes de TU grupo (muy recomendado)
- Campo: `chatId` (o `groupId`)
- Condición: **Text operators → Equal to**
- Valor: el ID exacto de tu grupo de WhatsApp.
  - Truco para conseguirlo: ejecuta el escenario una vez en modo "Run once", escribe algo en el grupo y copia el `chatId` que aparezca en el módulo disparador.

### Filtro B — Solo respuestas con formato de trivia
Queremos aceptar: `A`, `B`, `C`, `D`, `a`, `!resp B`, `respuesta: c`, etc.
Y queremos rechazar: mensajes largos de conversación.

Usa **dos condiciones** combinadas (Make permite varias líneas en un filtro):

**Condición 1 — El texto, ya recortado, empieza por A/B/C/D o por "!resp":**
- Campo: `messageText`
- Condición: **Text operators → Matches pattern (regex)**
- Patrón (regex):
  ```
  ^\s*(!?\s*resp(uesta)?[:.]?\s*)?[A-Da-d]\s*$
  ```
  Explicación en cristiano: acepta una sola letra A–D, opcionalmente precedida de `!resp` / `respuesta:`, y **nada más** (ni frases largas).

> Con esa sola condición regex basta para filtrar bien. Si tu proveedor no soporta "Matches pattern", usa este plan B con varias condiciones **OR**:
> - `messageText` → *Equal to* → `A` **OR**
> - `messageText` → *Equal to* → `B` **OR**
> - `messageText` → *Equal to* → `C` **OR**
> - `messageText` → *Equal to* → `D`
> (Repite en minúsculas o normaliza antes). El regex es más robusto porque tolera espacios y mayúsculas.

### Filtro C — Evitar textos largos (seguro extra)
- Campo: `length(messageText)` (función de Make) o el largo del texto
- Condición: **Numeric operators → Less than**
- Valor: `15`
- Esto descarta párrafos de conversación por si el regex dejara pasar algo raro.

---

## 3) Módulo Google Sheets — "Add a Row"

Añade el módulo **Google Sheets → Add a Row**.

1. **Connection**: conecta tu cuenta de Google (la dueña del Sheet).
2. **Spreadsheet**: elige tu archivo de la Trivia.
3. **Sheet Name**: selecciona **`Respuestas_Entrantes`**.
4. **Table contains headers**: `Yes` (para que Make muestre los nombres de columna).

Ahora mapea cada columna. El **orden de columnas** de la pestaña es:
`Timestamp | Dia_Fecha | Pregunta_ID | Usuario | Respuesta`

| Columna del Sheet | Qué poner en Make | Detalle |
|---|---|---|
| **Timestamp** | `formatDate(now; "YYYY-MM-DD HH:mm:ss.SSS")` | ⏱️ **Clave del sistema**: usa el reloj de Make con **milisegundos** (`.SSS`). NO uses el timestamp del proveedor. Inserta la variable `now` desde el panel de funciones de fecha. |
| **Dia_Fecha** | `formatDate(now; "YYYY-MM-DD")` | La fecha del día, sin hora. Sirve para agrupar la jornada. |
| **Pregunta_ID** | *(valor fijo que tú cambias)* escribe `P1` | ⚠️ Antes de lanzar cada pregunta, **edita este campo** a `P1`, `P2`, `P3`… y guarda el escenario. Así Make sabe a qué pregunta pertenece cada respuesta. (Alternativa avanzada: usar una celda del Sheet como "pregunta activa" y leerla con un módulo extra.) |
| **Usuario** | variable `senderName` (o `pushName`) | El nombre visible de quien respondió. Si viene vacío, usa `senderId`. |
| **Respuesta** | variable `messageText` (o `body`) | El texto crudo; el Apps Script ya lo normaliza a A/B/C/D. |

> 💡 **Sobre los milisegundos:** Google Sheets puede mostrar la celda redondeada, pero el texto `.SSS` queda guardado. Para que el ranking por velocidad sea justo, lo importante es que Make escriba la hora con milisegundos en el **momento exacto** en que recibe el mensaje — y eso lo hace la función `now` de Make, que se evalúa al ejecutarse el módulo.

### Formato de la columna Timestamp (una sola vez)
En Google Sheets, selecciona la columna **A** de `Respuestas_Entrantes` → menú **Formato → Número → Fecha y hora personalizada** → elige un formato que incluya milisegundos, por ejemplo:
```
dd/MM/yyyy HH:mm:ss.000
```
Así verás los milisegundos también en pantalla.

---

## Resumen del escenario terminado

```
┌─────────────────────────────┐
│ 1. Green API                │
│    Watch Incoming Messages  │   ← se dispara con cada mensaje del grupo
└──────────────┬──────────────┘
               │  (Filtro: chatId = tu grupo  Y  texto = ^\s*(!?\s*resp...)?[A-Da-d]\s*$)
┌──────────────▼──────────────┐
│ 2. (Filtro en el cable)     │
└──────────────┬──────────────┘
┌──────────────▼──────────────┐
│ 3. Google Sheets            │
│    Add a Row → Respuestas_Entrantes
│    Timestamp = formatDate(now;"YYYY-MM-DD HH:mm:ss.SSS")
│    Dia_Fecha = formatDate(now;"YYYY-MM-DD")
│    Pregunta_ID = P1  (lo editas por pregunta)
│    Usuario = senderName
│    Respuesta = messageText
└─────────────────────────────┘
```

Activa el escenario (interruptor **ON**) y ponlo en **Scheduling → Immediately** para que escuche en tiempo real.
