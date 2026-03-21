# 🚂 Railway Deployment Variables

### Para el Servicio del BACKEND (FastAPI):
```env
# Cambiar esto por el dominio real que Railway le asigne a tu Frontend (ej: https://investiq-frontend.up.railway.app)
CORS_ORIGINS=http://localhost:3000
```

### Para el Servicio del FRONTEND (Next.js):
```env
# Cambiar esto por el dominio real que Railway le asigne a tu Backend (ej: https://investiq-backend.up.railway.app)
BACKEND_URL=http://localhost:8000
```

**Nota:** 
El FRONTEND y BACKEND ahora usan `BACKEND_URL` dinámico. No necesitas definir ninguna variable `NEXT_PUBLIC_` en Railway porque todo el tráfico de API pasa por un proxy interno del Frontend (`/api/*`), lo que elimina completamente los problemas de CORS desde el navegador del usuario y mantiene un contenedor Docker puro e independiente del dominio.
