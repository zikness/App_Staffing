# Verificación — 27 de octubre de 2026

Entorno: Windows, Node 25.9.0, npm 11.12.1, Chrome headless con zona horaria America/Santiago. El requisito portable del proyecto es Node 22.12+ en rama 22 o Node 24+. No se ejecutó la batería en otras versiones de Node ni otros navegadores.

## Resultados ejecutados

- Instalación npm: correcta; lockfile incluido.
- `npm run build`: código de salida 0; TypeScript estricto y Vite 8.3.5, 16 módulos compilados.
- `npm ls --depth=0`: correcto, sin dependencias faltantes.
- `npm audit --json`: cero vulnerabilidades reportadas, incluidas las dependencias de desarrollo, en esta fecha.
- Chrome mediante Playwright: flujo integral aprobado sin errores JavaScript de página.
- Inspección visual de Mi espacio: se conserva el diseño de paneles, navegación, colores, tipografía y perfiles sugeridos del exportado. No se realizó comparación píxel a píxel de todas las pantallas.

## Flujo ejercitado en Chrome

1. Rechazo del login vacío y acceso con credenciales de demostración.
2. Creación de una solicitud y comprobación de su almacenamiento.
3. Selección de talento, creación de reserva y rechazo de un duplicado.
4. Programación de entrevista y registro del resultado Continúa.
5. Rechazo de término anterior al inicio de asignación.
6. Confirmación de asignación: persona asignada y solicitud cubierta.
7. Programación y confirmación de liberación: persona disponible y fecha de cierre en su asignación.
8. Consulta del evento de asignación en Historial.
9. Recarga: solicitud y sesión conservadas.
10. Carga de una reserva vencida persistida: estado Expirada y un único evento con StrictMode.
11. Cierre de sesión y regreso al login.

Las operaciones anteriores se verificaron por interfaz y por el estado persistido. La reserva vencida se preparó directamente en el almacenamiento de un contexto de navegador aislado; el resto se creó desde la interfaz.

## Alcance y límites

Se conservaron las validaciones originales de prioridad de reservas y conflicto de asignaciones, revisadas en código; no se ejecutaron todas sus combinaciones en navegador. Tampoco se hizo una auditoría completa de accesibilidad, pruebas móviles, concurrencia, cuotas de almacenamiento o recuperación de todas las variantes de datos corruptos. No se certifica preparación para producción. La funcionalidad es una demo local, según lo descrito en README.

Para repetir una comprobación manual, inicia con un navegador/origen sin datos, sigue la secuencia anterior y consulta Historial. Para crear datos nuevos usa la interfaz; las fechas deben ser futuras para reservas y entrevistas.

## Verificación adicional de la versión NTT DATA

Ejecutada el 27 de octubre de 2026 sobre un servidor Vite nuevo en el puerto 5175 (el servidor anterior conservaba una transformación CSS antigua):

- `npm run build`: aprobado con TypeScript estricto y Vite, sin dependencias nuevas.
- Flujo integral anterior repetido: aprobado sin errores JavaScript de página.
- Logo local: recurso cargado y comprobación visual de login y cabecera.
- Indicadores iniciales: 5 personas, 4 vacantes abiertas, 0 reservas y 1 liberación, contrastados con los datos semilla.
- Pool: 5 filas iniciales, 3 disponibles y búsqueda Python con un solo resultado.
- Exportación CSV: descarga correcta y contenido limitado a Diego Mora tras filtrar; no incluye Laura Prieto.
- Creación desde la interfaz de dos reservas de Laura Prieto para solicitudes distintas: un conflicto visible con prioridades 1 y 2.
- Seguimiento: 3 pendientes (2 reservas y 1 liberación), filtro Reserva con 2 filas y navegación al perfil.
- Navegación a 1180 px y revisión visual de escritorio a 1440 px; no se declara soporte móvil nuevo.

Se revisaron capturas de login, Mi espacio y Seguimiento. No se realizaron pruebas de permisos por rol, pues no se implementó un sistema de autorización.
