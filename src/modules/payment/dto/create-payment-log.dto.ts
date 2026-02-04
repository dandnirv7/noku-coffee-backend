export interface CreatePaymentLogDto {
  id: string;
  external_id?: string;
  status: string;
  amount: number;
}
