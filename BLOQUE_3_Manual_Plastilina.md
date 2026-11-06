# BLOQUE 3 — Manual "Explicado con Plastilina" 🧱

Esta es la guía para ti, paso a pasito, sin tecnicismos. Hazlo en orden: primero A, luego B, y el C es durante la reunión.

---

## 🟢 PASO A — Google Sheets (lo haces UNA sola vez)

1. Entra a **drive.google.com** y crea una **Hoja de cálculo nueva**. Ponle nombre, por ejemplo: `Trivia Juventud 2026`.
2. En el menú de arriba, haz clic en **Extensiones → Apps Script**.
   - Se abre una ventana nueva con un editor de código y un archivo llamado `Código.gs`.
3. **Borra** todo lo que haya ahí dentro (suele venir `function myFunction(){}`).
4. Abre el archivo **`Codigo.gs`** que te entregué, **copia TODO** y **pégalo** en ese editor.
5. Haz clic en el ícono de **guardar** (el disquete 💾) o `Ctrl + S`.
6. Arriba, donde dice una lista de funciones, selecciona **`crearPestanas`** y pulsa **▶ Ejecutar**.
   - La **primera vez** Google te pedirá permisos: clic en **Revisar permisos → elige tu cuenta → Avanzado → Ir a (nombre del proyecto) → Permitir**. (Es normal, es tu propio script.)
7. Vuelve a tu hoja de cálculo. ✨ Ahora verás **4 pestañas creadas solas**:
   - `Respuestas_Entrantes` (se llena sola con Make)
   - `Control_Trivia` (aquí defines las respuestas correctas)
   - `Resultados_Dia` (se llena cuando pides el campeón)
   - `Ranking_General` (el acumulado de la temporada)
8. **Recarga la página** de la hoja. Aparecerá un menú nuevo arriba llamado **🎯 Trivia**. Ese menú es tu control remoto: desde ahí ejecutas todo con clics.

> ✅ Listo el Paso A. No tienes que volver a tocar el código nunca más.

---

## 🔵 PASO B — Make.com (lo haces UNA sola vez)

1. Crea una cuenta gratis en **make.com**.
2. (Si usas Green API) entra a **green-api.com**, crea una instancia y **escanea el QR** con el WhatsApp que usarás para la trivia:
   - En tu teléfono: **WhatsApp → Ajustes → Dispositivos vinculados → Vincular dispositivo** → apunta la cámara al QR.
   - Copia el **ID de instancia** y el **Token** que te da Green API; los necesitarás para conectar el módulo en Make.
3. En Make, crea un **nuevo escenario** y arma los 3 módulos siguiendo el **BLOQUE 2**:
   - Módulo 1: disparador de WhatsApp (Green API → *Watch Incoming Messages*).
   - Filtro: solo tu grupo + solo respuestas A/B/C/D.
   - Módulo 3: Google Sheets → *Add a Row* → pestaña `Respuestas_Entrantes`.
4. Conecta tu cuenta de Google cuando Make lo pida (acepta permisos).
5. Haz una **prueba**: escribe una `A` en el grupo y revisa que aparezca una fila nueva en `Respuestas_Entrantes`. Si aparece con hora y milisegundos → ¡funciona! 🎉
6. Abajo a la izquierda del escenario, pon el interruptor en **ON** y en **Scheduling → Immediately**.
   - Así Make queda **corriendo en segundo plano** y escucha el grupo aunque cierres la pestaña.

> ✅ Listo el Paso B. Make ya está "escuchando" el grupo para siempre.

---

## 🟡 PASO C — Durante la reunión (cada semana)

### C.1 — Antes de empezar: configura las preguntas
1. Abre la pestaña **`Control_Trivia`**.
2. Por cada pregunta que vas a hacer, llena una fila:

   | Pregunta_ID | Respuesta_Correcta | Estado | Puntos_1 | Puntos_2 | Puntos_3 |
   |---|---|---|---|---|---|
   | P1 | A | Abierta | 3 | 2 | 1 |
   | P2 | C | Abierta | 3 | 2 | 1 |
   | P3 | B | Abierta | 3 | 2 | 1 |

   - **Pregunta_ID**: un nombre corto (`P1`, `P2`, …). Debe coincidir con el que pongas en Make.
   - **Respuesta_Correcta**: la letra correcta (A/B/C/D).
   - **Puntos_1/2/3**: cuántos puntos gana el 1º, 2º y 3º más rápido. (3-2-1 es lo clásico.)
   - *(Puedes dejar la Respuesta_Correcta vacía y escribirla justo después de lanzar la pregunta; da igual.)*

### C.2 — Lanzar cada pregunta al chat
1. En **Make**, abre el módulo 3 (Google Sheets) y cambia el campo **Pregunta_ID** al número que vas a lanzar (ej. `P1`). **Guarda** el escenario.
   - 👉 Esto le dice a Make: "las respuestas que lleguen ahora son de la P1".
2. En el **grupo de WhatsApp**, escribe tú la pregunta. Ejemplo:
   ```
   ❓ *PREGUNTA 1* ❓
   ¿En qué ciudad nació Jesús?
   A) Nazaret
   B) Belén
   C) Jerusalén
   D) Jericó

   Responde SOLO con la letra. ¡El más rápido gana! ⚡
   ```
3. La gente responde con `A`, `B`, `C` o `D`. Make va guardando cada respuesta con su hora exacta (milisegundos).
4. Cuando quieras cerrar, pide silencio y pasa al resultado.

### C.3 — Publicar los ganadores al instante
1. En la hoja, menú **🎯 Trivia → 📊 Resultado de UNA Pregunta**.
2. Escribe el ID (ej. `P1`) y acepta.
3. Aparece un cuadro con el texto **listo para WhatsApp**, algo así:
   ```
   🎯 RESULTADO DE LA PREGUNTA P1
   ✅ Respuesta correcta: B
   ━━━━━━━━━━━━━━━━━━━━
   🥇 María — 3 pts  ⚡ ¡El más rápido!
   🥈 Pedro — 2 pts  (+0.842s)
   🥉 Lucía — 1 pts  (+1.210s)
   ━━━━━━━━━━━━━━━━━━━━
   👥 Acertaron 8 de 12 respuestas.
   🙏 ¡Gloria a Dios y a seguir aprendiendo!
   ```
4. **Haz clic en el texto** (se selecciona solo), copia con `Ctrl+C` y **pégalo en el grupo**. ¡Listo, podio publicado! 🏆
5. Repite C.2 y C.3 para P2, P3, etc.

### C.4 — Declarar al Campeón del Día
1. Cuando termines TODAS las preguntas, menú **🎯 Trivia → 🏆 Campeón del Día**.
2. Sale el mensaje con el campeón y la tabla del día. Cópialo y pégalo en el grupo:
   ```
   🏆 CAMPEÓN DE LA JORNADA 🏆
   📅 06/11/2026
   ━━━━━━━━━━━━━━━━━━━━
   👑 María con 8 puntos!
   🎉 ¡Felicidades, campeón/a de hoy!
   ━━━━━━━━━━━━━━━━━━━━
   📊 TABLA DEL DÍA
   🥇 María — 8 pts (3 aciertos)
   🥈 Pedro — 5 pts (3 aciertos)
   🥉 Lucía — 3 pts (2 aciertos)
   ━━━━━━━━━━━━━━━━━━━━
   🙏 ¡Que Dios los bendiga! Nos vemos la próxima semana.
   ```

### C.5 — Cerrar la jornada (actualizar la temporada)
1. Menú **🎯 Trivia → 📅 Cerrar Jornada y Actualizar Ranking**.
2. Confirma con **Sí**. Esto suma los puntos del día al **`Ranking_General`** y le da +1 jornada ganada al campeón.
   - ⚠️ Hazlo **una sola vez** al final de cada reunión (si lo repites, sumaría doble).

> 🎉 ¡Y eso es todo! Cada semana solo repites el Paso C.

---

## ❓ Preguntas frecuentes rápidas

- **¿Y si alguien responde dos veces?** El sistema toma solo la **primera** respuesta de cada persona por pregunta. Las repetidas se ignoran.
- **¿Y si el timestamp se ve sin milisegundos?** Dale formato a la columna A como `dd/MM/yyyy HH:mm:ss.000` (ver BLOQUE 2). El valor con milisegundos igual se guarda aunque no se muestre.
- **¿Puedo empezar una nueva temporada?** Borra el contenido (no el encabezado) de `Ranking_General`.
- **¿Cada día borro `Respuestas_Entrantes`?** No es obligatorio, pero si quieres empezar limpio, borra las filas de datos (deja el encabezado) antes de la reunión. El Campeón del Día se calcula sobre lo que haya en `Control_Trivia` + `Respuestas_Entrantes`.
