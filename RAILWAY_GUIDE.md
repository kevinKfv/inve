# 🚂 Guía Completa para Desplegar InvestIQ Pro en Railway

Este proyecto es un **monorepo** con Frontend (Next.js · puerto **3000**) y Backend (FastAPI · puerto **8000**) en la misma carpeta. En Railway se despliegan como **dos servicios independientes** dentro del mismo proyecto.

---

## 🗺️ Arquitectura en Railway

```
Railway Project: InvestIQ Pro
│
├── Servicio "Backend"  (carpeta /backend)
│   ├── Framework : FastAPI (Python 3.11)
│   ├── Puerto interno : 8000  ← Railway lo sobreescribe con $PORT automáticamente
│   └── Dominio público : https://investiq-backend-xxxx.up.railway.app
│
└── Servicio "Frontend"  (carpeta /frontend)
    ├── Framework : Next.js 14 (Node 20)
    ├── Puerto interno : 3000  ← Railway lo sobreescribe con $PORT automáticamente
    └── Dominio público : https://investiq-frontend-xxxx.up.railway.app
```

> **¿A qué puerto apunta "Generate Domain"?**
> Railway detecta el `EXPOSE` del Dockerfile y enruta el dominio generado directamente a ese puerto.
> - **Backend** → `EXPOSE 8000` → el dominio apunta al **puerto 8000**
> - **Frontend** → `EXPOSE 3000` → el dominio apunta al **puerto 3000**
>
> No tienes que elegir el puerto manualmente. El dominio generado siempre hace HTTPS → puerto interno del contenedor.

---

## Paso 1 — Crear el Proyecto en Railway

1. Entra a [railway.app](https://railway.app/) e inicia sesión con tu cuenta de **GitHub**.
2. Haz clic en **"New Project"** → **"Empty Project"** (Proyecto Vacío).

---

## Paso 2 — Servicio BACKEND

### 2.1 Crear el servicio
1. Dentro del proyecto vacío, clic en **`+ New`** (arriba a la derecha).
2. Selecciona **"GitHub Repo"** → elige tu repositorio `inve`.
3. Haz clic en el bloque del servicio que acaba de aparecer.

### 2.2 Configurar Settings
1. Ve a la pestaña **`Settings`**.
2. (Opcional) Renombra el servicio a **`Backend`** en el campo _Service Name_.
3. En la sección **Build → Root Directory** escribe:
   ```
   /backend
   ```
   Presiona **Enter** o haz clic fuera para guardar.

### 2.3 Generar dominio del Backend
1. Baja hasta la sección **Networking**.
2. Haz clic en **"Generate Domain"**.
3. Railway creará una URL del tipo:
   ```
   https://investiq-backend-xxxx.up.railway.app
   ```
4. **Copia y guarda esta URL** — la necesitarás para configurar el Frontend.

> ℹ️ El dominio enruta automáticamente a `EXPOSE 8000` del Dockerfile del backend.

---

## Paso 3 — Servicio FRONTEND

### 3.1 Crear el servicio
1. Clic en **`+ New`** → **"GitHub Repo"** → elige de nuevo el mismo repositorio `inve`.
2. Haz clic en el nuevo bloque que apareció.

### 3.2 Configurar Settings
1. Ve a la pestaña **`Settings`**.
2. (Opcional) Renombra el servicio a **`Frontend`**.
3. En **Build → Root Directory** escribe:
   ```
   /frontend
   ```

### 3.3 Generar dominio del Frontend
1. Baja hasta **Networking** → **"Generate Domain"**.
2. Railway creará una URL del tipo:
   ```
   https://investiq-frontend-xxxx.up.railway.app
   ```
3. **Copia y guarda esta URL** — la necesitarás para el CORS del Backend.

> ℹ️ El dominio enruta automáticamente a `EXPOSE 3000` del Dockerfile del frontend.

---

## Paso 4 — Variables de Entorno (⚠️ CRÍTICO)

Una vez generados ambos dominios, configura las variables de entorno en cada servicio.

### 4.1 Variables del BACKEND

Ve al servicio **Backend** → pestaña **`Variables`** → clic en **`New Variable`** y agrega **todas** estas:

| Variable | Valor | Descripción |
|---|---|---|
| `CORS_ORIGINS` | `https://investiq-frontend-xxxx.up.railway.app` | URL **exacta** del frontend (sin `/` al final). Permite que el browser llame a la API. |
| `CACHE_TTL` | `300` | TTL de caché en segundos (5 min por defecto). |
| `APCA_API_KEY_ID` | *(tu key de Alpaca)* | API Key de Alpaca (paper o live). |
| `APCA_API_SECRET_KEY` | *(tu secret de Alpaca)* | Secret de Alpaca. |
| `APCA_API_BASE_URL` | `https://paper-api.alpaca.markets` | Endpoint de Alpaca. Para live trading usa `https://api.alpaca.markets`. |

> ⚠️ El valor de `CORS_ORIGINS` debe ser el dominio del **Frontend**, sin barra final.
> Ejemplo: `https://investiq-frontend-xxxx.up.railway.app` ✅
> Incorrecto: `https://investiq-frontend-xxxx.up.railway.app/` ❌

### 4.2 Variables del FRONTEND

Ve al servicio **Frontend** → pestaña **`Variables`** → agrega estas variables:

| Variable | Valor | Descripción |
|---|---|---|
| `BACKEND_URL` | `https://investiq-backend-xxxx.up.railway.app` | URL del Backend para llamadas desde el servidor (SSR). |
| `NEXT_PUBLIC_API_URL` | `https://investiq-backend-xxxx.up.railway.app` | URL del Backend para llamadas directas desde el navegador del usuario (Client-side fetching). |

---

## Paso 5 — Verificar el Deploy

Una vez agregadas las variables, Railway reconstruirá automáticamente ambos servicios.

1. Haz clic en el servicio **Backend** → pestaña **`Deployments`**.
2. Espera a que el indicador cambie a 🟢 **Success**.
3. Haz clic en el servicio **Frontend** → pestaña **`Deployments`** → espera a 🟢 **Success**.
4. Abre el dominio del **Frontend** en tu navegador.

### Verificación rápida del Backend

Puedes confirmar que el backend está vivo entrando a:
```
https://investiq-backend-xxxx.up.railway.app/health
```
Deberías ver:
```json
{ "status": "ok" }
```

Y para ver la documentación interactiva de la API (Swagger UI):
```
https://investiq-backend-xxxx.up.railway.app/docs
```

---

## Paso 6 — Troubleshooting Frecuente

### ❌ Error CORS en la consola del browser
- Verifica que `CORS_ORIGINS` en el backend tenga la URL **exacta** del frontend (con `https://`, sin `/` al final).
- Guarda la variable y espera el redeploy automático.

### ❌ El frontend muestra "Failed to fetch" o respuestas vacías
- Verifica que `BACKEND_URL` en el frontend apunte al dominio correcto del backend.
- Recuerda que esta variable se usa en el servidor durante el build; si la cambias, Railway necesita hacer un nuevo build.

### ❌ El deploy falla con "No start command found"
- Asegúrate de haber escrito `/backend` o `/frontend` correctamente en **Root Directory**.
- Railway usa el `Dockerfile` de cada subcarpeta; si el path está mal, no lo encuentra.

### ❌ El dominio del backend no responde
- Railway asigna el puerto a través de la variable de entorno `$PORT`.
- El `Dockerfile` del backend ya lo maneja: `CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"`. No debes cambiar esto.

---

## 📋 Resumen de Puertos

| Servicio | Puerto Dockerfile | Puerto Railway | Protocolo externo |
|---|---|---|---|
| Backend (FastAPI) | `8000` | Asignado por `$PORT` | HTTPS 443 → interno 8000 |
| Frontend (Next.js) | `3000` | Asignado por `$PORT` | HTTPS 443 → interno 3000 |

> Railway siempre expone el servicio en **HTTPS puerto 443** externamente, sin importar el puerto interno del contenedor. El dominio generado (`*.up.railway.app`) maneja el SSL automáticamente.

---

## 🔒 Variables sensibles — Alpaca Trading

Las claves de Alpaca son **secretos**. No las pongas en el código fuente ni en el repositorio. Solo en las **Variables de Railway**:

| Variable | Entorno Paper | Entorno Live |
|---|---|---|
| `APCA_API_BASE_URL` | `https://paper-api.alpaca.markets` | `https://api.alpaca.markets` |
| `APCA_API_KEY_ID` | Tu key de paper trading | Tu key de live trading |
| `APCA_API_SECRET_KEY` | Tu secret de paper trading | Tu secret de live trading |

---

¡Tu plataforma InvestIQ Pro ya estará en vivo y funcionando en la web! 🚀
