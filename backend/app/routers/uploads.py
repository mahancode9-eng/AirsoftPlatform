import os
import secrets

from fastapi import APIRouter, Depends, HTTPException, UploadFile

from ..config import get_settings
from ..security import require_admin

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/upload")
async def upload_image(file: UploadFile):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="فقط تصاویر jpg/png/webp/gif مجاز هستند")
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="حداکثر حجم فایل ۱۰ مگابایت است")
    settings = get_settings()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    name = secrets.token_hex(12) + ext
    path = os.path.join(settings.UPLOAD_DIR, name)
    with open(path, "wb") as f:
        f.write(content)
    return {"url": f"/uploads/{name}"}
