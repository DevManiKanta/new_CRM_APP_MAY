/**
 * Coupon codes for the bill screen (case-insensitive match on apply).
 * percent: extra % off the amount after manual discount
 * flat: fixed INR off the amount after manual discount
 */
export const BILL_COUPONS = {
  HERB10: { label: "10% off", type: "percent", value: 10 },
  TEA15: { label: "15% off", type: "percent", value: 15 },
  HONEY500: { label: "₹500 off", type: "flat", value: 500 },
  FIRST250: { label: "₹250 off", type: "flat", value: 250 },
};
