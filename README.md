# 🎯 Sistema de Trivia en Vivo — Juventud Católica

Automatiza una trivia semanal en WhatsApp: captura respuestas en tiempo real, mide la velocidad al milisegundo, declara el podio de cada pregunta, el **Campeón del Día** y mantiene el **Ranking General** de la temporada.

```
WhatsApp (grupo)  →  Make.com  →  Google Sheets  →  Apps Script  →  Textos listos para pegar
```

## Contenido del paquete

| Archivo | Qué es |
|---|---|
| **`Codigo.gs`** | BLOQUE 1 — Google Apps Script completo. Péguelo en Extensiones → Apps Script. |
| **`BLOQUE_2_Make_com.md`** | Guía para armar el escenario de Make.com (sin programar). |
| **`BLOQUE_3_Manual_Plastilina.md`** | Manual paso a paso: qué hacer tú en Sheets, en Make y durante la reunión. |

## Arranque rápido (3 pasos)

1. **Sheets:** crea una hoja → Extensiones → Apps Script → pega `Codigo.gs` → ejecuta `crearPestanas`. Recarga y usa el menú **🎯 Trivia**.
2. **Make.com:** arma el escenario del `BLOQUE_2` (WhatsApp → Filtro A/B/C/D → Google Sheets *Add a Row*) y ponlo en ON.
3. **Reunión:** define preguntas en `Control_Trivia`, lanza al grupo, y usa el menú 🎯 Trivia para publicar ganadores.

## Las 4 pestañas

- `Respuestas_Entrantes` — la llena Make (Timestamp con ms, Dia_Fecha, Pregunta_ID, Usuario, Respuesta).
- `Control_Trivia` — tú defines Respuesta_Correcta, Estado y Puntos_1/2/3 por pregunta.
- `Resultados_Dia` — resumen del día + Campeón de la Jornada.
- `Ranking_General` — acumulado de la temporada (puntos, jornadas ganadas, aciertos).

## Características clave

- ⏱️ Ranking por **velocidad con milisegundos**.
- 🥇🥈🥉 Podio automático por pregunta con tiempo de respuesta.
- 🛡️ **Anti-duplicados**: solo cuenta la primera respuesta de cada persona por pregunta.
- 📝 Mensajes **listos para copiar/pegar** en WhatsApp (con emojis y negritas).
- 📅 Cierre de jornada que actualiza el ranking de la temporada.

> Lea el `BLOQUE_3_Manual_Plastilina.md` si quiere la versión "para toda la familia", paso a pasito.
