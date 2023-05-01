export interface OrderResponse {
  addressBase: string;
  addressDetail: string;
  createAt: string;
  deletedAt?: string | null;
  deliveryText: string;
  id: number;
  orderMemberTel: string;
  orderName: string;
  orderNo: string;
  orderQuantity: number;
  orderStatus: string;
  pcc: string;
  percentyId: string;
  productName: string;
  productOptionContents: string;
  productOrderNo: string;
  productOrderStatus: string;
  receiverName: string;
  receiverPhone: string;
  settlementExpectAmount: number;
  taobaoUrl: string;
  updateAt: string;
  zipcode: number;
  invoiceNo: null | string;
  payAmt: null | number;
  deliveryAmt: null | number;
}
