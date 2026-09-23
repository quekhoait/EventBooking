from marshmallow import fields, EXCLUDE, pre_dump

from app.dto import BaseSchema

class PaymentRequest(BaseSchema):
    ticket_code = fields.Str(required=True)
    method = fields.Str(required=True)



class CreatePaymentResponse(BaseSchema):
    payUrl = fields.String(required=True)

    @pre_dump
    def normalize_pay_url(self, data, **kwargs):
        if isinstance(data, dict):
            if "payUrl" not in data and "pay_url" in data:
                data = {**data, "payUrl": data["pay_url"]}
        elif hasattr(data, "pay_url") and not hasattr(data, "payUrl"):
            return {"payUrl": data.pay_url}
        return data

    class Meta:
        unknown = EXCLUDE

class MomoPaymentCallbackRequest(BaseSchema):
    orderId = fields.Str(required=True)
    amount = fields.Int(required=True)
    transId = fields.Int(required=True)
    resultCode = fields.Int(required=True)
    extraData = fields.Str(required=True)

    class Meta:
        unknown = EXCLUDE