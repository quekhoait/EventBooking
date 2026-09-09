import base64

from marshmallow import fields, ValidationError
from cloudinary.uploader import upload


def upload_image_file(file_storage, folder="general"):
    """Upload file ảnh từ form lên Cloudinary, trả về secure_url (hoặc None)."""
    if not file_storage or not file_storage.filename:
        return None

    content = file_storage.read()
    if not content:
        return None

    data_uri = f"data:{file_storage.mimetype};base64," + base64.b64encode(content).decode("utf-8")
    try:
        result = upload(data_uri, folder=folder, resource_type="auto")
        return result.get("secure_url")
    except Exception as e:
        print("Lỗi Cloudinary:", e)
        raise ValidationError("Upload ảnh lên Cloudinary thất bại.")


class CloudinaryImageField(fields.Field):
    def __init__(self, folder="general", **kwargs):
        self.folder = folder
        super().__init__(**kwargs)

    def _serialize(self, value, attr, obj, **kwargs):
        if value is None:
            return None
        return str(value)

    def _deserialize(self, value, attr, data, **kwargs):
        if not value:
            return None

        if isinstance(value, str) and value.startswith("http"):
            return value

        try:
            result = upload(value, folder=self.folder, resource_type="auto")
            return result.get("secure_url")
        except Exception as e:
            print("Lỗi Cloudinary:", e)
            raise ValidationError("Upload ảnh lên Cloudinary thất bại.")