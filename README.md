# Staffing Workspace

Proyecto independiente de React + Vite + TypeScript, adaptado del código exportado de Figma Make. Conserva la interfaz, navegación, estilos, datos de demostración y almacenamiento local. No necesita una cuenta de Figma ni sus servicios para ejecutarse.

## Inicio en VS Code

1. Instala Node.js 24 LTS (también compatible con Node 22.12 o posterior de la rama 22).
2. Extrae el ZIP y abre la carpeta `staffing-workspace` en VS Code.
3. Abre Terminal > Nueva terminal y ejecuta:

```sh
npm install
npm run dev
```

Abre la URL que indique Vite, normalmente http://localhost:5173. En PowerShell, si la política de ejecución bloquea `npm.ps1`, usa `npm.cmd install` y `npm.cmd run dev`.

Para entrar utiliza `demo@staffing.com` y cualquier contraseña no vacía. El correo debe tener formato válido. No se envían ni almacenan contraseñas: es un acceso de demostración, no autenticación real.

## Comandos

```sh
npm run typecheck  # Verificación estricta de TypeScript
npm run build      # TypeScript y compilación de producción en dist/
npm run preview    # Servir localmente la compilación, normalmente puerto 4173
```

Se incluye `package-lock.json`: `npm ci` permite reproducir las versiones verificadas. No se incluyen dependencias instaladas ni dist en el ZIP; se generan con los comandos anteriores. Para publicar en una subcarpeta, configura `base` en `vite.config.ts`.

## Estructura

- `src/App.tsx`: componentes, modelos, datos de ejemplo, operaciones y persistencia originales con correcciones puntuales.
- `src/index.css`: estilos originales y Tailwind CSS 4.
- `src/main.tsx`: entrada React con StrictMode.
- `public/favicon.svg`: icono local de Staffing.
- `vite.config.ts`: configuración independiente de React y Tailwind; conserva el alias `@`.
- `index.html`: documento en español con metadatos locales.
- `VERIFICACION.md`: alcance y resultados de las comprobaciones.

## Funcionalidades de demostración

- Login/logout local con identidad fija de Clara Méndez.
- Mi espacio: solicitudes pendientes, liberaciones, reservas y perfiles sugeridos por coincidencia de habilidades.
- Solicitudes: alta, edición, búsqueda, filtros, cierre/cancelación con motivo y cobertura de vacantes.
- Talento: perfiles, habilidades, filtros y estados.
- Reservas: vencimiento futuro, bloqueo de duplicados, cancelación con motivo y cola por antigüedad. Se revisan vencimientos al abrir y cada 30 segundos mientras la aplicación está abierta.
- Entrevistas: programación y resultado con comentario; no se crean reuniones ni invitaciones reales.
- Preasignación/asignación: prioridad de reservas, conflictos de fechas, cobertura de vacantes y cierre de reservas competidoras.
- Liberaciones: programación desde una persona asignada y confirmación manual; al confirmar se cierra el intervalo de su asignación.
- Historial: actividad local, filtros y enlaces a registros. Notificaciones calculadas desde los datos locales; marcar leídas es un estado temporal de interfaz.

Los nombres, clientes, proyectos y solicitudes iniciales son ficticios. Las fechas iniciales se calculan al crear la demo; no son datos de un sistema corporativo. Las reglas son las de un prototipo, no un motor completo de planificación laboral.

## Persistencia y recursos

Los datos usan `localStorage`, con las claves originales `staffing-workspace-v2` y `staffing-workspace-session`. Persisten tras recargar o cerrar el navegador; cerrar sesión no borra la información. No hay sincronización entre usuarios, equipos ni pestañas. Cambiar entre localhost y 127.0.0.1, cambiar el puerto o usar preview crea un origen distinto y por tanto otro almacenamiento. Los datos del entorno de Figma no se transfieren automáticamente: el ZIP contiene código y datos iniciales, no el almacenamiento del navegador de Figma.

Si el almacenamiento está bloqueado, la aplicación puede trabajar en memoria pero no conservar los cambios. No uses datos personales reales. Para reiniciar la demo, elimina únicamente esas dos claves desde DevTools > Application > Local Storage y recarga (se perderán los cambios de esa demo).

Se conserva la fuente Inter desde Google Fonts, un recurso público independiente de Figma. Sin conexión se usa la fuente sans-serif del sistema; los iconos y la aplicación no dependen de imágenes remotas. Se conserva el diseño de escritorio original, con ancho mínimo de 1180 px; no se ha rediseñado para móvil.

## Qué necesita backend para uso real

- Autenticación corporativa/SSO, sesiones seguras y permisos por rol.
- API y base de datos con datos reales, copias de seguridad y migraciones.
- Validaciones y transacciones en servidor para evitar reservas/asignaciones concurrentes o manipulación desde el navegador.
- Sincronización multiusuario, auditoría confiable con identidad real y reglas de negocio acordadas para liberaciones, disponibilidad y cobertura.
- Procesos programados para vencimientos con el navegador cerrado; notificaciones y conexión con correo/calendario si se requieren.
- Protección de datos, controles de acceso, supervisión y despliegue HTTPS.

## Adaptación realizada

Se reutilizó el código exportado; no se reconstruyó la aplicación. Se retiraron los plugins, variables FIGMA y configuración `.figma/make/site.json` de Vite, junto con las ranuras HTML exclusivas de Figma. Se omitieron las instrucciones de agentes y scripts de despliegue del entorno original porque no son necesarios para ejecutar el proyecto.

Se añadieron metadatos HTML, configuración npm reproducible, requisitos de Node y comprobación de tipos durante build. Se corrigieron callbacks sin tipos, compatibilidad de `replaceAll`, fechas sin hora interpretadas como UTC, IDs potencialmente repetidos, intervalos de asignación invertidos, reducción de vacantes por debajo de las cubiertas y validación de solicitudes/fechas al reservar o entrevistar. Se habilitó programar liberaciones de personas asignadas y se cierra su intervalo al confirmarlas. La expiración ahora se reevalúa y evita duplicar eventos con StrictMode.

## Actualización NTT DATA — integración del segundo diseño

Se incorporaron a la base original las ideas funcionales del prototipo `NTT Data Staffing Platform`:

- Logo NTT DATA local en login y cabecera y ajustes de color azul corporativo. Archivo SVG obtenido del [sitio oficial](https://www.nttdata.com/global/en/news/press-release/2025/may/050901); recurso original: https://www.nttdata.com/global/en/-/media/assets/images/header_logo.svg?iar=0&rev=010dc1bd851f4d2aaaaf407cf338776b. La marca pertenece a NTT DATA; su inclusión identifica el prototipo solicitado, no una integración corporativa.
- Resumen operativo con personas, vacantes pendientes, reservas y liberaciones calculadas desde los datos locales. Las tarjetas abren la sección correspondiente.
- Pipeline de seis estados y alertas de reservas que vencen en 48 horas o personas con reservas competidoras.
- Pool en tabla: búsqueda por persona, identificador, perfil, habilidades y proyecto; filtros de estado y seniority; acceso al perfil y exportación CSV de los resultados filtrados. El archivo usa UTF-8 con BOM y separador punto y coma para Excel, y neutraliza prefijos de fórmula.
- Seguimiento: reservas, entrevistas y liberaciones pendientes ordenadas por fecha, filtro por tipo y búsqueda; enlaces a personas y solicitudes.
- Conflictos: comparación de reservas activas por orden de llegada y acceso a su gestión existente, con motivo de cancelación e historial.

Se mantuvieron las cuatro secciones originales, los formularios y las claves de localStorage. No se importaron las cifras estáticas, nombres o registros del segundo prototipo, por lo que los contadores pueden diferir de sus capturas. Tampoco se inventaron campos SAP, CV o Studio que no existen en los datos originales. El selector de roles del segundo diseño era una simulación visual; esta entrega mantiene el login demo y no añade permisos ficticios. Autorización por rol y decisiones ejecutivas excepcionales requieren definir reglas e implementarlas en backend.

Para esta versión usa el archivo `staffing-workspace-ntt-data.zip`. Los comandos de instalación y ejecución no cambian.
