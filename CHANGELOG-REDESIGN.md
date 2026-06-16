# CHANGELOG REDESIGN Agendalix

## Backup
- Estado: creado y verificado.
- Timestamp: 20260427-013211
- Ruta: `/var/www/agendalix/.backup-front-20260427-013211`

## WhatsApp QR fix
- Estado: implementado y rebuild OK. QA visual limitada por fallo del runtime Browser Use; contrato API y generacion Evolution validados.
- Causa raiz definitiva: Evolution API generaba QR correctamente; el puente Next no normalizaba el QR que ya venia en `/instance/create`, dependia de un segundo `/instance/connect`, devolvia contratos parciales y silenciaba fallos con catches mudos. En el camino de "already exists" el POST podia borrar una sesion real antes de intentar recrear.
- Latencia medida dentro del contenedor `agendalix`:
  - `neg_test_88820_1777246361471` sin webhook: `/instance/create` 201 con `qrcode.base64`; `/instance/connect` devolvio `base64` en 17ms.
  - `neg_test_webhook_36566_1777246454488` con webhook: `/instance/create` 201 con `qrcode.base64`; `/instance/connect` devolvio `base64` en 11ms.
  - `neg_728491b0-039e-4798-a39c-b2e2931255e4` con UUID: path raw y `encodeURIComponent` devolvieron `base64` en 27-28ms.
- Diff resumido:
  - `src/lib/whatsapp.ts`: `encodeURIComponent` en parametros de path, logging estructurado `[evo:create]`, `[evo:connect]`, `[evo:qr]`, `[evo:restart]`, `[evo:delete]`, normalizacion del payload QR, `waitForQr(instanceName, timeoutMs=8000)`, polling interno 250ms, restart de rescate y sin catches mudos.
  - `src/app/api/panel/whatsapp/route.ts`: contrato estable `{ status, qrcode, code, expiresAt, error? }`, validado con `zod`; no borra en `already exists`; `forceReset` explicito para borrar+recrear; `expiresAt` a 45s cuando hay QR.
  - `src/components/panel/WhatsAppConnect.tsx`: backoff 2/3/5/8/13s hasta 4min, countdown circular 45s, skeleton QR, estado error con "Reintentar" y "Forzar reset", instrucciones siempre visibles y aviso para WhatsApp Business ya conectado.
- Como reproducir si vuelve a romperse: dentro del contenedor `agendalix`, crear una instancia fresca con `POST /instance/create { instanceName, qrcode:true, integration:"WHATSAPP-BAILEYS" }`, comprobar si `qrcode.base64` existe y repetir `GET /instance/connect/{encodeURIComponent(instanceName)}` midiendo 0/300/800/1500ms. Si Evolution devuelve base64 y la UI no, revisar logs `[evo:qr]` del contenedor Next.

## WhatsApp connect polling
- Estado: resuelto junto al bloque QR. El polling en cliente ya usa backoff con timeout y cleanup por `setTimeout`.

## Sistema visual
- Estado: implementado.
- Direccion visual: cockpit editorial oscuro/claro, menos "SaaS generico" y mas herramienta viva para agenda local. Ancla #7F77DD, acento calido #F0B36A, neutros con temperatura y firma `agx-underline` compartida entre landing y panel.
- Tipografia: stack utilitario local con variable `--font-inter` y stack editorial local para titulares display. Se elimino `next/font/google` para que el build no dependa de descarga externa.
- Modo claro/oscuro: toggle persistente `agendalix.theme`; variables CSS para superficies, lineas e ink.
- `/design-system`: creado con `robots: noindex` y protegido en produccion salvo `?preview=agx`.

## Landing y producto
- Estado: implementado.
- Navbar: link "Blog" eliminado; queda "Clientes". Logo vuelve a `/`. Cmd/Ctrl+K abre paleta.
- Sectores: chips reales con estado en URL `?sector=`; mutan hero, features y pricing.
- Features: eliminado auto-rotate; ahora responde a hover/focus, sin `setInterval`.
- Pricing: precios numericos en EUR base; rendering con `Intl.NumberFormat`; `/mes` separado; ROI inline; tabla comparativa horizontal; FAQ por plan; testimonio dentro de Pro.
- Currency switcher: deteccion por `Intl.DateTimeFormat().resolvedOptions().timeZone`, persistencia localStorage, toggle en navbar/footer, `src/lib/fx.ts` con tipos fijos auditables.
- Microcopy antes/despues:
  1. "Empieza gratis" -> "Abrir agenda automatica"
  2. "Ver demo" -> "Verlo en vivo"
  3. "Blog" -> "Clientes"
  4. "Para cualquier negocio local" -> "IA para agenda de salon"
  5. "Tu negocio trabaja" -> "Tu salon responde"
  6. "Aunque tu no estes" -> "antes de que se enfrie el tinte"
  7. "Una plataforma..." -> "Un cockpit que entiende como se mueve tu agenda"
  8. "Precios" -> "Precios en moneda activa"
  9. "Mas popular" -> "Mas elegido"
  10. "Empezar" -> "Empezar con [plan]"
  11. "Calculadora" -> "Cuanto recuperas si la agenda deja de gotear"
  12. "Sin QR" -> skeleton QR visual
  13. "Generando QR..." -> skeleton + countdown
  14. "Conectando..." -> "Conectando"
  15. "Cargando..." -> "Cargando"
  16. "No se pudo preparar" -> "No pudimos preparar el QR"
  17. "Regenerar QR" -> "Renovar QR"
  18. "Configurar agente" -> "Resolver ahora"
  19. "Resumen de hoy" -> "Briefing del dia"
  20. "Proximas citas" -> prioridad con siguiente accion
  21. "Sin resultados" -> busqueda con indicador
  22. "Cliente eliminado" -> "Cliente eliminado. Puedes deshacer durante 5s"
  23. "Gestionar suscripcion" visible en Plan
  24. "Terminos" marcado pendiente legal
  25. "Cookies" marcado pendiente legal
  26. "Aviso legal" marcado pendiente legal
  27. "Offline" -> mensaje honesto de sincronizacion
  28. "Cmd K" -> paleta de comandos
  29. "?" -> modal de atajos
  30. "Comoda/Compacta" -> densidad persistente
  31. "WhatsApp automatico" -> copy sectorial
  32. "Recordatorios automaticos" -> copy sectorial
  33. "Lista de espera inteligente" -> copy sectorial
  34. "Informe semanal" -> "Informes semanales"
  35. "Recuperacion de clientes" -> "Recuperacion suave"
  36. "Multisede" -> "Panel de demanda" segun sector
  37. "Acceder al panel" conservado como accion utilitaria
  38. "Moneda" como control explicito
  39. "Modo claro/oscuro" via icon button accesible
  40. "Design system temporal" protegido/noindex

## Bugs cazados
- Build roto por comillas sin escapar en testimonio de Pricing: corregido.
- Warnings React hooks por refs en cleanup: capturados en variable local.
- Warning `@next/next/no-img-element` en AdminSetup: migrado a `next/image` con `unoptimized`.
- `Footer` importaba `CurrencySwitcher` fuera de provider en `/privacidad`: `useCurrency` ahora tiene fallback seguro.
- `setInterval` de notificaciones migrado a Supabase Realtime con cleanup.
- Cleanup de notificaciones ajustado para cerrar solo su canal realtime, sin `removeAllChannels`.
- `catch {}` silencioso en Agenda reemplazado por log.
- `DELETE+recreate` de WhatsApp en `already exists` eliminado para no perder sesiones escaneadas.
- Limpieza de instancias: `fetchInstances` devolvio 1 `neg_*`; Supabase REST devolvio 0 negocios y Evolution confirmo despues lista vacia. Queda documentado como accion ejecutada segun criterio "sin negocio.id"; revisar si esa instancia debia conservarse.
- Tracking negativo global eliminado; quedan letter-spacing a 0 en escalas tipograficas y logo.

## Pendientes humanos
- Escaneo con movil real no ejecutado desde Codex. Validado que Evolution genera base64 inmediato y que el contrato UI/API expone QR/countdown/error.
- Lighthouse/screenshot matrix no ejecutado: el plugin Browser Use fallo al iniciar runtime local ("ruta no encontrada"). No instale herramientas nuevas de navegador sin confirmacion.
- Warnings externos restantes del build: notice npm de nueva version y aviso Docker Compose buildx/Bake. No son warnings React/hidratacion.
- Git no esta disponible en `/var/www/agendalix`; la verificacion de archivos prohibidos se hizo contra el backup de `src` y por lista de subidas para raiz.

## Reporte final
- Resumen visual: Agendalix pasa de landing SaaS generica a cockpit de agenda local con sector vivo, moneda real y sistema claro/oscuro. El panel gana briefing operativo, Cmd/Ctrl+K, atajos, densidad, onboarding y acciones con undo. WhatsApp deja de depender de un segundo connect fragil y muestra errores reales.
- Archivos creados destacados: `src/lib/fx.ts`, `src/lib/i18n.ts`, `src/components/landing/*`, `src/components/CommandPalette.tsx`, `src/components/panel/PanelChrome.tsx`, `src/components/panel/OnboardingWizard.tsx`, `src/hooks/useDebouncedValue.ts`, legales, `/design-system`, `manifest.json`, `sw.js`, iconos y `og-image.png`.
- Archivos modificados destacados: `src/lib/whatsapp.ts`, `src/app/api/panel/whatsapp/route.ts`, `WhatsAppConnect.tsx`, `Navbar`, `Footer`, `Hero`, `Sectors`, `Features`, `Pricing`, `AdminDashboard`, `NotifBell`, `Configuracion`, `Clientes`, `Conversaciones`, `Informes`, `layout.tsx`, `globals.css`, `tailwind.config.ts`.
- Build real: `docker compose up -d --build` OK. Home First Load JS: 151 kB (objetivo <180 kB). `/panel/configuracion`: 135 kB. `/panel/informes`: 239 kB por Recharts + jsPDF.
- Smoke HTTP: `/`, `/manifest.json`, `/terminos`, `/cookies`, `/aviso-legal`, `/design-system` -> 200. `/api/panel/whatsapp` sin sesion -> 401 con `{status,qrcode,code,expiresAt,error}`.
- Logs runtime: Next listo sin errores ni warnings de hidratacion (`Ready in 171ms`).
- Verificacion prohibidos: `src/middleware.ts`, webhooks WhatsApp/Stripe, `src/app/api/cron`, `src/lib/supabase`, `src/lib/agent.ts` y `src/lib/deepseek.ts` coinciden con backup `20260427-013211`.
- Lighthouse real: no disponible por fallo del runtime Browser Use; pendiente humano.
- Rollback exacto:
  ```bash
  TS=20260427-013211
  rm -rf src && cp -r .backup-front-$TS/src src && \
  cp .backup-front-$TS/tailwind.config.ts . && \
  cp .backup-front-$TS/globals.css src/app/globals.css && \
  docker compose up -d --build
  ```
