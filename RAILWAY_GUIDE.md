# 🚂 Guía Paso a Paso para Desplegar en Railway

Dado que el proyecto tiene tanto el Frontend como el Backend en el mismo repositorio (un "monorepo"), vamos a desplegar **dos servicios** separados en el mismo proyecto de Railway, apuntando a diferentes carpetas.

Sigue estos pasos exactamente:

### Paso 1: Crear el Proyecto
1. Entra a [Railway.app](https://railway.app/) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"New Project"** y luego selecciona **"Empty Project"** (Proyecto Vacío).

### Paso 2: Crear el Servicio del BACKEND
1. Dentro de tu nuevo proyecto vacío, haz clic en **"Add a Service"** o en el botón **`+ New`** (arriba a la derecha).
2. Selecciona **"GitHub Repo"** y elige tu repositorio `inve`.
3. Inmediatamente haz clic en el bloque del repositorio que acaba de aparecer (tu nuevo servicio).
4. Ve a la pestaña **`Settings`** (Configuración).
5. Desliza hacia abajo hasta la sección **Build** -> **Root Directory** y escribe `/backend`. (Asegúrate de guardar/presionar Enter). 
6. Ve un poco más abajo a la sección **Networking** y haz clic en **"Generate Domain"**. Copia la URL que te genera (ej: `investiq-backend-production...up.railway.app`). ¡Guárdala para el siguiente paso!
7. *(Opcional)* Arriba del todo en Settings, cámbiale el nombre al servicio por "Backend".

### Paso 3: Crear el Servicio del FRONTEND
1. Haz clic de nuevo en el botón **`+ New`** (arriba a la derecha) en la vista general del proyecto.
2. Selecciona **"GitHub Repo"** y vuelve a elegir tu repositorio `inve` (sí, por segunda vez).
3. Haz clic en el nuevo bloque que apareció.
4. Ve a la pestaña **`Settings`**.
5. Desliza hacia la sección **Build** -> **Root Directory** y escribe `/frontend`.
6. Ve a **Networking** y haz clic en **"Generate Domain"**. Copia esa nueva URL (ej: `inve-production...up.railway.app`). 
7. *(Opcional)* Arriba del todo en Settings, cámbiale el nombre al servicio por "Frontend".

### Paso 4: Configurar los Permisos y Variables (¡MUUUY IMPORTANTE!)
Ahora que ambos tienen sus dominios generados, tenemos que "conectar" sus comunicaciones a través de las Variables de Entorno.

1. **Configurar el Backend:**
   - Haz clic en tu servicio **Backend** y ve a la pestaña **`Variables`**.
   - Haz clic en `New Variable`.
   - **VARIABLE NAME:** `CORS_ORIGINS`
   - **VALUE:** `https://<EL-DOMINIO-QUE-GENERO-EL-FRONTEND>` (Asegúrate de quitar el `/` final del link).
   - Haz clic en Add.

2. **Configurar el Frontend:**
   - Haz clic en tu servicio **Frontend** y ve a la pestaña **`Variables`**.
   - Haz clic en `New Variable`.
   - **VARIABLE NAME:** `BACKEND_URL`
   - **VALUE:** `https://<EL-DOMINIO-QUE-GENERO-EL-BACKEND>` (Ejemplo: `https://investiq-backend-production...up.railway.app`).
   - Haz clic en Add.

### Paso 5: ¡Listo!
Al agregar estas variables, Railway automáticamente reiniciará y reconstruirá ambos servicios. Una vez que los indicadores se pongan de color Verde ("Success"), simplemente entra al Link del **Frontend**. 

¡Tu plataforma de inversiones ya estará en vivo y funcionando en la web! 🚀
