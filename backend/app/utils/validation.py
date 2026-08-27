from marshmallow import fields, ValidationError
from cloudinary.uploader import upload


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