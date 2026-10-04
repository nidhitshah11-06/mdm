from contextlib import asynccontextmanager
from collections.abc import AsyncIterator
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.api.routes import router
from app.core.config import settings
from app.core.database import engine


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    yield
    await engine.dispose()


app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")

# Serve the React frontend from /  so the whole app runs on one port (8000)
_frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
_product_site_dir = os.path.join(_frontend_dir, "product-site-dist")
if os.path.isdir(_frontend_dir):
    # app.jsx must be served with correct MIME type for Babel
    @app.get("/app.jsx")
    async def serve_app_jsx():
        return FileResponse(
            os.path.join(_frontend_dir, "app.jsx"),
            media_type="application/javascript",
            headers={"Cache-Control": "no-cache, no-store, must-revalidate"},
        )

    @app.get("/")
    async def serve_index():
        product_site_index = os.path.join(_product_site_dir, "index.html")
        index_path = product_site_index if os.path.isfile(product_site_index) else os.path.join(_frontend_dir, "index.html")
        return FileResponse(
            index_path,
            media_type="text/html",
            headers={"Cache-Control": "no-cache, no-store, must-revalidate", "Pragma": "no-cache"},
        )

    @app.get("/dashboard")
    @app.get("/dashboard/")
    async def serve_dashboard():
        return FileResponse(
            os.path.join(_frontend_dir, "index.html"),
            media_type="text/html",
            headers={"Cache-Control": "no-cache, no-store, must-revalidate", "Pragma": "no-cache"},
        )

    # Serve everything else in /frontend as static
    app.mount("/static", StaticFiles(directory=_frontend_dir), name="frontend")

    if os.path.isdir(_product_site_dir):
        app.mount("/", StaticFiles(directory=_product_site_dir, html=True), name="product-site")
